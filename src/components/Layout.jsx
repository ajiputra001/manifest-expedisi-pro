import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 overflow-hidden relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide z-10 relative">
            {/* Background Gradient */}
            <div className="fixed top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950 -z-10 animate-gradient-xy pointer-events-none"></div>
            <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
