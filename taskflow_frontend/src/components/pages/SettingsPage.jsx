import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFontSize } from '../../context/FontSizeContext';
import { useHolidayRegion } from '../../context/HolidayRegionContext';
import { api } from '../../services/api';

const SettingsPage = () => {
  const { user, token, updateStoredUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { holidayRegion, holidayRegionOptions, setHolidayRegion } = useHolidayRegion();
  const userId = user?._id || user?.id;

  const [profileForm, setProfileForm] = useState({
    name: user?.name || user?.username || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    setProfileForm({
      name: user?.name || user?.username || '',
      email: user?.email || '',
    });
  }, [user?.email, user?.name, user?.username]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!userId) {
      return;
    }

    setProfileLoading(true);
    setProfileStatus(null);
    setProfileError(null);

    try {
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      };

      const response = await api.updateCurrentUser(payload, token);
      if (response?.user) {
        updateStoredUser(response.user);
      }
      setProfileStatus('Profile updated successfully.');
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!userId) {
      return;
    }

    setPasswordLoading(true);
    setPasswordStatus(null);
    setPasswordError(null);

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required.');
      setPasswordLoading(false);
      return;
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Password confirmation does not match.');
      setPasswordLoading(false);
      return;
    }

    try {
      await api.updateCurrentUser(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        token,
      );
      setPasswordStatus('Password updated successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setPasswordError(error.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-100">
        We could not load your account information. Please sign out and log back in.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <p className="text-xs uppercase text-indigo-600 dark:text-indigo-400">Profile</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Account details</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Update how your name and email appear across the workspace.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleProfileSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Full name</label>
            <input
              name="name"
              required
              value={profileForm.name}
              onChange={handleProfileChange}
              className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Email address</label>
            <input
              type="email"
              name="email"
              required
              value={profileForm.email}
              onChange={handleProfileChange}
              className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="name@company.com"
            />
          </div>

          {profileStatus && <p className="text-sm text-emerald-600 dark:text-emerald-300">{profileStatus}</p>}
          {profileError && <p className="text-sm text-rose-600 dark:text-rose-300">{profileError}</p>}

          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-2xl border border-indigo-500/60 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-500/20 disabled:opacity-60 dark:border-indigo-400/50 dark:text-indigo-200"
          >
            {profileLoading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <p className="text-xs uppercase text-indigo-600 dark:text-indigo-400">Security</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Password</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose a strong password to keep your account secure.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Current password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">New password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Repeat new password"
                required
              />
            </div>

            {passwordStatus && <p className="text-sm text-emerald-600 dark:text-emerald-300">{passwordStatus}</p>}
            {passwordError && <p className="text-sm text-rose-600 dark:text-rose-300">{passwordError}</p>}

            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-2xl border border-indigo-500/60 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-500/20 disabled:opacity-60 dark:border-indigo-400/50 dark:text-indigo-200"
            >
              {passwordLoading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <p className="text-xs uppercase text-indigo-600 dark:text-indigo-400">Appearance</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Theme</p>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Text size</p>
              <div className="flex gap-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                      fontSize === size
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/20 dark:text-indigo-200'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Holiday region
              </label>
              <select
                value={holidayRegion}
                onChange={(event) => setHolidayRegion(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {holidayRegionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Public holidays in the dashboard calendar will use this country.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
