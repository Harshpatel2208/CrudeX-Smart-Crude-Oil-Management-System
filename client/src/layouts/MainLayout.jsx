import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import PriceTicker from '../components/PriceTicker';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="w-100" style={{ minWidth: 0 }}>
        <Navbar toggleSidebar={toggleSidebar} />
        <PriceTicker />
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Responsive Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop d-lg-none" 
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1015,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        />
      )}
    </div>
  );
};

export default MainLayout;
