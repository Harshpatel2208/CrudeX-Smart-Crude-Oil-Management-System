import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Navbar.css';

const Navbar = ({ onSearchResults, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [alerts, setAlerts] = useState([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const alertsDropdownRef = useRef(null);

  useEffect(() => {
    // Hide dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(event.target)) {
        setShowAlertsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [prodRes, logRes] = await Promise.all([
          api.get('/products'),
          api.get('/logistics')
        ]);

        const lowStockAlerts = prodRes.data
          .filter(p => Number(p.stock_quantity) < 5000 && p.status === 1)
          .map(p => ({
            id: `low-stock-${p.product_id}`,
            type: 'warning',
            title: 'Low Inventory Warning',
            message: `${p.product_name} is down to ${Number(p.stock_quantity).toLocaleString()} Bbl.`,
            path: '/products',
            icon: 'bi-exclamation-triangle-fill'
          }));

        const transitAlerts = logRes.data
          .filter(l => l.status === 'In Transit')
          .map(l => ({
            id: `transit-${l.logistics_id}`,
            type: 'info',
            title: 'Shipment In Transit',
            message: `Order ${l.order_number} (${l.transporter_name}) is currently in transit.`,
            path: '/logistics',
            icon: 'bi-truck'
          }));

        setAlerts([...lowStockAlerts, ...transitAlerts]);
      } catch (err) {
        console.error('Failed to generate dynamic alerts:', err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      try {
        // Query search endpoint
        // Let's search across multiple endpoints or we can hit specific ones
        const [custRes, prodRes, leadRes] = await Promise.all([
          api.get(`/customers?search=${query}`),
          api.get(`/products`), // Filtered client-side
          api.get(`/leads`) // Filtered client-side
        ]);

        const filteredProds = prodRes.data.filter(p => 
          p.product_name.toLowerCase().includes(query.toLowerCase()) || 
          p.product_code.toLowerCase().includes(query.toLowerCase())
        );

        const filteredLeads = leadRes.data.filter(l => 
          l.title.toLowerCase().includes(query.toLowerCase()) || 
          l.customer_name.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults({
          customers: custRes.data.slice(0, 3),
          products: filteredProds.slice(0, 3),
          leads: filteredLeads.slice(0, 3)
        });
        setShowDropdown(true);

        // Optional: call parent if they want to load full results in main content
        if (onSearchResults) {
          onSearchResults({
            query,
            customers: custRes.data,
            products: filteredProds,
            leads: filteredLeads
          });
        }
      } catch (err) {
        console.error('Global search error:', err);
      }
    } else {
      setSearchResults(null);
      setShowDropdown(false);
      if (onSearchResults) {
        onSearchResults(null);
      }
    }
  };

  const handleSelectResult = () => {
    setShowDropdown(false);
    setSearchQuery('');
  };

  const getInitials = (name) => {
    if (!name) return 'JD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="navbar navbar-expand fixed-top custom-navbar">
      <div className="container-fluid px-3">
        {/* Mobile Toggle Button */}
        <button 
          onClick={toggleSidebar} 
          className="btn btn-link text-white p-0 me-3 d-lg-none"
          title="Toggle Navigation"
          style={{ textDecoration: 'none' }}
        >
          <i className="bi bi-list fs-3"></i>
        </button>

        {/* Search Input wrapper */}
        <div className="d-flex align-items-center flex-grow-1" ref={dropdownRef}>
          <div className="position-relative w-100" style={{ maxWidth: '400px' }}>
            <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control ps-5 rounded-pill border-light-subtle bg-light text-sm"
              placeholder="Search clients, products, contracts, leads..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery && setShowDropdown(true)}
            />

            {/* Instant suggestions list */}
            {showDropdown && searchResults && (
              <div className="search-dropdown-menu position-absolute bg-white shadow rounded-4 p-3 mt-2 w-100 border overflow-auto" style={{ maxHeight: '400px', zIndex: 1050 }}>
                {searchResults.customers.length === 0 && searchResults.products.length === 0 && searchResults.leads.length === 0 && (
                  <div className="text-muted text-center py-2">No matches found</div>
                )}

                {searchResults.customers.length > 0 && (
                  <div className="mb-2">
                    <h6 className="text-xs text-uppercase text-primary fw-semibold mb-1">Customers</h6>
                    <div className="list-group list-group-flush">
                      {searchResults.customers.map(c => (
                        <div key={c.customer_id} className="list-group-item list-group-item-action border-0 px-1 py-1.5 rounded" onClick={handleSelectResult}>
                          <div className="fw-semibold text-sm">{c.company_name}</div>
                          <div className="text-muted text-xs">{c.contact_person} • {c.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.products.length > 0 && (
                  <div className="mb-2">
                    <h6 className="text-xs text-uppercase text-success fw-semibold mb-1">Products</h6>
                    <div className="list-group list-group-flush">
                      {searchResults.products.map(p => (
                        <div key={p.product_id} className="list-group-item list-group-item-action border-0 px-1 py-1.5 rounded" onClick={handleSelectResult}>
                          <div className="fw-semibold text-sm">{p.product_name}</div>
                          <div className="text-muted text-xs">{p.product_code} • ₹{Number(p.unit_price).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.leads.length > 0 && (
                  <div className="mb-2">
                    <h6 className="text-xs text-uppercase text-warning fw-semibold mb-1">Leads</h6>
                    <div className="list-group list-group-flush">
                      {searchResults.leads.map(l => (
                        <div key={l.lead_id} className="list-group-item list-group-item-action border-0 px-1 py-1.5 rounded" onClick={handleSelectResult}>
                          <div className="fw-semibold text-sm">{l.title}</div>
                          <div className="text-muted text-xs">{l.customer_name} • {l.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Nav Menu items */}
        <div className="navbar-nav ms-auto align-items-center gap-3">
          {/* Globe language icon */}
          <button className="btn btn-link text-secondary p-0 hover-warning d-flex align-items-center justify-content-center" title="Language" style={{ textDecoration: 'none' }}>
            <i className="bi bi-globe fs-5"></i>
          </button>
          
          {/* Notification bell icon */}
          <div className="position-relative" ref={alertsDropdownRef}>
            <button 
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)} 
              className="btn btn-link text-secondary p-0 hover-warning position-relative d-flex align-items-center justify-content-center" 
              title="Notifications" 
              style={{ textDecoration: 'none' }}
            >
              <i className="bi bi-bell fs-5"></i>
              {alerts.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem', padding: '3px 6px', marginTop: '2px', marginLeft: '-2px' }}>
                  {alerts.length}
                </span>
              )}
            </button>
            {showAlertsDropdown && (
              <div className="dropdown-menu dropdown-menu-end show shadow border-0 rounded-4 p-3 mt-2 position-absolute" style={{ width: '300px', right: 0, zIndex: 1050 }}>
                <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                  <h6 className="m-0 fw-bold text-sm text-white" style={{ color: '#f8fafc' }}>System Alerts</h6>
                  <span className="badge bg-secondary-subtle text-secondary text-xs">{alerts.length} New</span>
                </div>
                <div className="overflow-auto" style={{ maxHeight: '250px' }}>
                  {alerts.length === 0 ? (
                    <div className="text-muted text-center py-3 text-xs">
                      <i className="bi bi-bell-slash fs-4 d-block mb-1"></i> No active alerts
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <div 
                        key={alert.id} 
                        onClick={() => {
                          setShowAlertsDropdown(false);
                          window.location.href = alert.path;
                        }}
                        className={`d-flex gap-2 p-2.5 rounded-3 mb-2 cursor-pointer list-group-item-action ${
                          alert.type === 'warning' ? 'bg-warning-subtle text-warning' : 'bg-primary-subtle text-primary'
                        }`}
                        style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px' }}
                      >
                        <div className="fs-5 mt-0.5"><i className={`bi ${alert.icon}`}></i></div>
                        <div>
                          <div className="fw-bold text-xs" style={{ color: alert.type === 'warning' ? '#fbbf24' : '#38bdf8' }}>{alert.title}</div>
                          <div className="text-xs text-white-50 mt-0.5">{alert.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="nav-item dropdown">
            <button className="nav-link dropdown-toggle border-0 bg-transparent p-0 d-flex align-items-center" id="navbarDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              <span className="avatar-sm rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                {getInitials(user?.name)}
              </span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2" aria-labelledby="navbarDropdown">
              <li>
                <div className="dropdown-header text-muted">Signed in as <br /><strong className="text-white">{user?.email}</strong></div>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button onClick={logout} className="dropdown-item text-danger d-flex align-items-center">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
