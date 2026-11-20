import { deleteApp, getApp, getApps, initializeApp } from "firebase/app";
import { formatCustomerId, reserveCustomerNumber } from "./customerIdService";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import { get, ref, update, serverTimestamp } from "firebase/database";
import { database, firebaseConfig } from "../lib/firebase";
import { CLIENT_ADMIN_ROLE } from "../utils/authAccess";
import activityLogService from "./activityLogService";

const PROVISIONING_APP_NAME = "reactcms-client-admin-provisioning";

function getProvisioningApp() {
  return getApps().some((app) => app.name === PROVISIONING_APP_NAME)
    ? getApp(PROVISIONING_APP_NAME)
    : initializeApp(firebaseConfig, PROVISIONING_APP_NAME);
}

function clientAdminError(error) {
  const messages = {
    "auth/email-already-in-use": "That email already has a login. Use another email address.",
    "auth/invalid-email": "Enter a valid client admin email address.",
    "auth/operation-not-allowed": "Enable Email/Password sign-in in Firebase Authentication before creating client logins.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "auth/network-request-failed": "The client login could not be created because of a network error."
  };

  const mapped = new Error(messages[error?.code] || error?.message || "The client login could not be created.");
  mapped.code = error?.code || "client-admin/unknown";
  return mapped;
}

export const clientAdminService = {
  async assignPortal(website, clientShort) {
    const short = clientShort.trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(short)) throw new Error("Enter a client short code using letters and numbers.");
    const snapshot = await get(ref(database, `websites/${website.id}`));
    const current = snapshot.val();
    const account = current?.clientAdmin;
    if (!account?.uid || account.uid !== website.clientAdmin?.uid) {
      throw new Error("The client login changed. Reopen this dialog and try again.");
    }
    if (account.customerId) return account.customerId;
    const number = current.customerNumber || await reserveCustomerNumber(website.id);
    const customerId = formatCustomerId(number, short, current.createdAt);
    await update(ref(database), {
      [`users/${account.uid}/customerId`]: customerId,
      [`websites/${website.id}/customerNumber`]: number,
      [`websites/${website.id}/clientAdmin/customerId`]: customerId,
      [`websites/${website.id}/clientAdmin/clientShort`]: short
    });
    return customerId;
  },
  async create({ website, email, password, name, clientShort, actorUid }) {
    if (!website?.id) throw new Error("Select a website before creating its client login.");
    const short = String(clientShort || "").trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(short)) throw new Error("Enter a client short code using letters and numbers.");
    const customerNumber = website.customerNumber || await reserveCustomerNumber(website.id);
    const customerId = formatCustomerId(customerNumber, short, website.createdAt);

    const provisioningApp = getProvisioningApp();
    const provisioningAuth = getAuth(provisioningApp);
    let createdUser = null;

    try {
      const credential = await createUserWithEmailAndPassword(
        provisioningAuth,
        String(email || "").trim().toLowerCase(),
        password
      );
      createdUser = credential.user;

      const now = serverTimestamp();
      const previousUid = website.clientAdmin?.uid;
      const clientId = String(name || "").trim() || `${website.name} Admin`;
      const profile = {
        uid: createdUser.uid,
        email: createdUser.email,
        name: clientId,
        clientId,
        customerId,
        role: CLIENT_ADMIN_ROLE,
        company: website.name,
        companyId: website.id,
        websiteId: website.id,
        websiteIds: { [website.id]: true },
        disabled: false,
        createdBy: actorUid || "admin_local",
        createdAt: now,
        updatedAt: now
      };
      const websiteClientAdmin = {
        uid: createdUser.uid,
        email: createdUser.email,
        name: profile.name,
        clientId: profile.clientId,
        customerId,
        clientShort: short,
        status: "active",
        createdAt: now,
        updatedAt: now
      };
      const updates = {
        [`users/${createdUser.uid}`]: profile,
        [`websites/${website.id}/clientAdmin`]: websiteClientAdmin,
        [`websites/${website.id}/customerNumber`]: customerNumber
      };

      if (previousUid && previousUid !== createdUser.uid) {
        updates[`users/${previousUid}/disabled`] = true;
        updates[`users/${previousUid}/disabledAt`] = now;
        updates[`users/${previousUid}/updatedAt`] = now;
      }

      try {
        await update(ref(database), updates);
      } catch (databaseError) {
        await deleteUser(createdUser).catch(() => {});
        createdUser = null;
        throw databaseError;
      }

      try {
        await activityLogService.logActivity(
          "client_admin_created",
          previousUid ? "Client login replaced" : "Client login created",
          `${profile.email} can access ${website.name}`,
          website.id
        );
      } catch (logError) {
        console.warn("Client login was created, but its activity log could not be saved.", logError);
      }

      return {
        uid: profile.uid,
        email: profile.email,
        name: profile.name,
        clientId: profile.clientId,
        customerId,
        websiteId: website.id
      };
    } catch (error) {
      throw clientAdminError(error);
    } finally {
      if (provisioningAuth.currentUser) {
        await signOut(provisioningAuth).catch(() => {});
      }
    }
  },

  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(getAuth(), String(email || "").trim().toLowerCase());
      return true;
    } catch (error) {
      throw clientAdminError(error);
    }
  },

  async disposeProvisioningApp() {
    const app = getApps().find((candidate) => candidate.name === PROVISIONING_APP_NAME);
    if (app) await deleteApp(app);
  }
};

export default clientAdminService;
