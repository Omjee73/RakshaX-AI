import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="mx-auto mt-20 max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-4xl font-extrabold">404</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Page not found.</p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white"
      >
        Go Home
      </Link>
    </section>
  );
}
