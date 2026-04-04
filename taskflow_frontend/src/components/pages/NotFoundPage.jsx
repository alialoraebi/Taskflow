import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
    <p className="text-sm uppercase text-rose-500 dark:text-rose-300">404</p>
    <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">We lost that signal</h1>
    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
      The view you requested is offline. Jump back into the main dashboard.
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-500/20 hover:text-indigo-900 dark:border-indigo-500/40 dark:text-indigo-100"
    >
      Return to dashboard
    </Link>
  </div>
);

export default NotFoundPage;
