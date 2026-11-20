import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-admin-bg flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-3xl border border-admin-border bg-slate-900 p-8 text-center shadow-xl">
        <img src="/logo.png" alt="Rocket Kit" className="mx-auto mb-8 w-40 rounded-xl bg-white" />
        <p className="mb-2 text-3xl font-bold text-orange-400">404</p>
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-slate-300">This URL is unavailable. Check the address or use the login link provided by your administrator.</p>
        <Link to="/dashboard" className="mt-6 inline-block rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          Go to dashboard
        </Link>
      </section>
    </main>
  );
}
