import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../navigation/Sidebar';
import TopBar from '../navigation/TopBar';

const pageMeta = {
  '/': { title: 'Overview' },
  '/projects': { title: 'Projects' },
  '/tasks': { title: 'Tasks' },
  '/settings': { title: 'Settings' },
};

const DashboardLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true);

  const meta = useMemo(
    () =>
      pageMeta[location.pathname] || {
        title: 'Console',
      },
    [location.pathname],
  );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        desktopVisible={desktopSidebarVisible}
        onDesktopClose={() => setDesktopSidebarVisible(false)}
      />
      <div className={`flex flex-1 flex-col transition-all duration-300 ${desktopSidebarVisible ? 'lg:ml-64' : 'lg:ml-0'}`}>
        <TopBar 
          title={meta.title} 
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          onDesktopSidebarToggle={() => setDesktopSidebarVisible(true)}
          desktopSidebarVisible={desktopSidebarVisible}
        />
        <main className="flex-1 bg-gray-50 px-6 py-8 dark:bg-slate-950 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
