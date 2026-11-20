import { get, ref, runTransaction } from "firebase/database";
import { database } from "../lib/firebase";

export const customerIdPattern = /^rkb2[a-z0-9]{2}\d{4,}-[a-z0-9]+$/;

export function clientPortal(customerId) {
  return customerIdPattern.test(customerId || "") ? `/webport-${customerId}` : "/webport";
}

export async function reserveCustomerNumber(websiteId) {
  const snapshot = await get(ref(database, "websites"));
  const existingIds = Object.entries(snapshot.val() || {})
    .sort(([leftId, left], [rightId, right]) =>
      (left.createdAt || 0) - (right.createdAt || 0) || leftId.localeCompare(rightId))
    .map(([id]) => id);
  const counter = ref(database, "websiteCustomerNumbers");
  // Prime the local transaction state with the server's current assignments.
  await get(counter);
  const result = await runTransaction(counter, (current) => {
    const assignments = { ...current?.assignments };
    let last = current?.last || 0;
    for (const id of [...existingIds, websiteId]) {
      if (!assignments[id]) assignments[id] = ++last;
    }
    return { last, assignments };
  });
  if (!result.committed) throw new Error("Could not reserve the website customer number.");
  return result.snapshot.val().assignments[websiteId];
}

export function formatCustomerId(number, short, createdAt) {
  const year = Number(new Intl.DateTimeFormat("en", {
    year: "numeric", timeZone: "Asia/Kolkata"
  }).format(typeof createdAt === "number" ? createdAt : Date.now()));
  const yearCode = (parseInt("sx", 36) + year - 2026).toString(36).padStart(2, "0");
  return `rkb2${yearCode}${String(number).padStart(4, "0")}-${short}`;
}
