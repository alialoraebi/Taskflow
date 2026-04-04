import { Link } from 'react-router-dom';

const tabClass = (isActive) => {
  if (isActive) {
    return 'flex-1 rounded-xl bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white';
  }

  return 'flex-1 rounded-xl px-3 py-2 text-center text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white';
};

const AuthLayout = ({ title, mode, children }) => (
  <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{title}</h1>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/70">
        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <Link to="/login" className={tabClass(mode === 'login')}>
            Sign In
          </Link>
          <Link to="/signup" className={tabClass(mode === 'signup')}>
            Sign Up
          </Link>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
