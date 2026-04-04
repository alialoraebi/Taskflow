import MenuIcon from '@mui/icons-material/Menu';

const TopBar = ({ title, onMenuToggle, onDesktopSidebarToggle, desktopSidebarVisible }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-6 py-4 text-gray-900 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-white">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-3">
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="rounded-2xl p-2 text-2xl text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white lg:hidden"
            onClick={onMenuToggle}
          >
            ☰
          </button>
          {/* Desktop sidebar toggle - only show when sidebar is hidden */}
          {!desktopSidebarVisible && (
            <button
              type="button"
              className="hidden rounded-2xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:block"
              onClick={onDesktopSidebarToggle}
              title="Show sidebar"
            >
              <MenuIcon />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
