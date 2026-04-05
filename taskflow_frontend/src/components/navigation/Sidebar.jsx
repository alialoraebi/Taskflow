import { NavLink } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose, desktopVisible = true, onDesktopClose }) => {
  const { logout } = useAuth();

  const navItems = [
    { label: 'Overview', path: '/', icon: DashboardIcon },
    { label: 'Projects', path: '/projects', icon: FolderIcon },
    { label: 'Tasks', path: '/tasks', icon: CheckCircleIcon },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white text-gray-900 backdrop-blur transition-transform duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${desktopVisible ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}
    >
      <div className="flex h-full flex-col overflow-y-auto px-5 py-6">
        <div className="flex items-center justify-center">
          <div className="select-none">
            <h1 className="text-xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">Task</span>
              <span className="text-gray-800 dark:text-white">Flow</span>
            </h1>
          </div>
        </div>
        <div className="absolute right-3 top-6 flex gap-2">
          {/* Mobile close button */}
          <button
            type="button"
            className="rounded-full p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white lg:hidden"
            onClick={onClose}
          >
            ✕
          </button>
          {/* Desktop close button */}
          <button
            type="button"
            className="hidden rounded-full p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white lg:block"
            onClick={onDesktopClose}
          >
            ✕
          </button>
        </div>

        <nav className="mt-10 space-y-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`
                }
                onClick={onClose}
              >
                <IconComponent fontSize="small" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={() => {
              onClose?.();
              logout();
            }}
            className="flex w-full items-center space-x-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-500/20 hover:text-rose-700 dark:border-rose-500/20 dark:text-rose-200 dark:hover:text-rose-100"
          >
            <LogoutIcon fontSize="small" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
