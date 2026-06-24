import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import PriceTicker from '../components/PriceTicker';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e) => {
      if (document.fullscreenElement) {
        const isF5 = e.key === 'F5';
        const isCtrlR = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r';
        if (isF5 || isCtrlR) {
          e.preventDefault();
          setRefreshKey(prev => prev + 1);
          window.dispatchEvent(new CustomEvent('app-refresh'));
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={`app-container ${isFullscreen ? 'layout-fullscreen' : ''}`}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} isFullscreen={isFullscreen} />
      <div className="w-100" style={{ minWidth: 0 }}>
        <Navbar toggleSidebar={toggleSidebar} toggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />
        <PriceTicker />
        <main className="main-content">
          <Outlet key={refreshKey} />
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
