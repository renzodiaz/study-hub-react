import { useState } from 'react';
import { DrawerProvider } from '@contexts/DrawerProvider';
import { Outlet } from '@tanstack/react-router';
import Drawer from './partials/Drawer';
import Sidebar from './partials/Sidebar';
import Header from './partials/Header';

const SidebarLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <DrawerProvider>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="lg:pl-72">
          <Header setSidebarOpen={setSidebarOpen} />
          <main className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
        <Drawer />
      </DrawerProvider>
    </div>
  );
};

export default SidebarLayout;
