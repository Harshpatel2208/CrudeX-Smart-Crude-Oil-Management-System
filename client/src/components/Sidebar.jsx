import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, isFullscreen }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'JD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isClient = user?.role === 'Client';
  const isAdmin = ['SuperAdmin', 'CompanyAdmin'].includes(user?.role);

  return (
    <div className={`sidebar bg-gradient-blue text-white shadow ${isOpen ? 'show' : ''}`}>
      {/* Brand Logo Header */}
      <div className="brand-header d-flex align-items-center justify-content-between p-3 border-bottom border-light border-opacity-10">
        <Link to="/" className="logo-link d-flex align-items-center text-decoration-none w-100 h-100">
          <i className="bi bi-droplet-fill text-warning fs-3 logo-icon me-2"></i>
          <h3 className="brand-text m-0 fw-bold tracking-wide text-white" style={{ fontSize: '1.2rem' }}>Crude-X</h3>
        </Link>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose} 
          className="btn btn-link text-secondary p-0 d-lg-none"
          title="Close Navigation"
          style={{ textDecoration: 'none' }}
        >
          <i className="bi bi-x-lg fs-5"></i>
        </button>
      </div>

      {/* Menu Links */}
      <div className="menu-container py-3 flex-grow-1 overflow-auto">
        <ul className="nav nav-pills flex-column px-2 gap-1">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
              <i className="bi bi-grid me-3 fs-5"></i>
              <span>Dashboard</span>
            </NavLink>
          </li>
          
          {isAdmin && (
            <li className="nav-item">
              <NavLink to="/team" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
                <i className="bi bi-person-badge me-3 fs-5"></i>
                <span>Team & SaaS Settings</span>
              </NavLink>
            </li>
          )}

          <li className="nav-item">
            <NavLink to="/orders" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
              <i className="bi bi-truck me-3 fs-5"></i>
              <span>Orders Log</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/customers" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
              <i className="bi bi-search me-3 fs-5"></i>
              <span>Customer Search</span>
            </NavLink>
          </li>

          {!isClient && (
            <>
              <li className="nav-item">
                <NavLink to="/leads" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-clipboard-check me-3 fs-5"></i>
                  <span>Leads Funnel</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/opportunities" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-graph-up me-3 fs-5"></i>
                  <span>Opportunities</span>
                </NavLink>
              </li>
            </>
          )}

          <li className="nav-item">
            <NavLink to="/products" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
              <i className="bi bi-droplet-half me-3 fs-5"></i>
              <span>Products & Margins</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/contracts" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
              <i className="bi bi-file-earmark-text me-3 fs-5"></i>
              <span>Contracts</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/logistics" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
              <i className="bi bi-geo-alt me-3 fs-5"></i>
              <span>Logistics Tracker</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/invoices" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
              <i className="bi bi-receipt me-3 fs-5"></i>
              <span>Invoices</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/payments" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
              <i className="bi bi-currency-rupee me-3 fs-5"></i>
              <span>Payments Ledger</span>
            </NavLink>
          </li>

          {!isClient && (
            <li className="nav-item">
              <NavLink to="/activity-logs" className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}>
                <i className="bi bi-journal-text me-3 fs-5"></i>
                <span>Activity Logs</span>
              </NavLink>
            </li>
          )}
        </ul>
      </div>

      {/* Profile Footer Section */}
      <div className="sidebar-footer p-3 border-top border-light border-opacity-10 mt-auto">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="avatar me-2.5 rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', minWidth: '38px', fontSize: '0.85rem' }}>
              {getInitials(user?.name)}
            </div>
            <div className="text-start">
              <div className="fw-bold text-white text-sm lh-1" style={{ fontSize: '0.85rem', marginBottom: '2px' }}>{user?.name || 'John Doe'}</div>
              <div className="text-muted lh-1" style={{ fontSize: '0.725rem' }}>{user?.role || 'Sales Manager'}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-link text-secondary p-0 ms-2 hover-warning" title="Logout" style={{ textDecoration: 'none' }}>
            <i className="bi bi-box-arrow-right fs-5"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
