import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import ErrorMessage from '../shared/ErrorMessage';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, authLoading } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout title="Sign in" mode="login">
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorMessage message={error} />

        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Username</label>
          <input
            type="text"
            name="username"
            required
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            placeholder="johndoe"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Password</label>
          <input
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={authLoading}
          className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-500/20 hover:text-indigo-900 dark:border-indigo-500/40 dark:text-indigo-100 disabled:opacity-50"
        >
          {authLoading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-300">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
            Create account
          </Link>
        </p>

      </form>
    </AuthLayout>
  );
};

export default LoginPage;
