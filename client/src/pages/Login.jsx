import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

const Login = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submitBtnRef = useRef(null);

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setTimeout(() => {
      submitBtnRef.current?.focus();
    }, 50);
  };

  useEffect(() => {
    const handleEnterPress = (e) => {
      if (e.key === 'Enter') {
        if (document.body.classList.contains('swal2-shown')) {
          return;
        }
        if (!isRegister && email && password && !loading) {
          e.preventDefault();
          handleSubmit(e);
        } else if (isRegister && name && email && password && companyName && !loading) {
          e.preventDefault();
          handleRegister(e);
        }
      }
    };

    window.addEventListener('keydown', handleEnterPress);
    return () => {
      window.removeEventListener('keydown', handleEnterPress);
    };
  }, [email, password, name, companyName, isRegister, loading]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!email || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter both email and password.'
      });
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Welcome Back!',
        text: 'Successfully logged in to CRM.',
        timer: 1500,
        showConfirmButton: false
      });
      navigate('/');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Failed',
        text: result.message
      });
    }
  };

  const handleRegister = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!name || !email || !password || !companyName) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please fill in all registration fields.'
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register-tenant', {
        name,
        email,
        password,
        companyName
      });
      setLoading(false);
      Swal.fire({
        icon: 'success',
        title: 'SaaS Tenant Registered!',
        text: 'Your company workspace has been provisioned. Please log in using your owner credentials.',
        confirmButtonColor: '#ffc107'
      });
      setIsRegister(false);
      setPassword('');
    } catch (error) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.response?.data?.message || 'Failed to create workspace. Try another name/email.'
      });
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-gradient-blue">
      <div className="card shadow-lg p-5 border-0 rounded-4" style={{ maxWidth: '480px', width: '95%', background: 'var(--card-bg)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 bg-warning bg-opacity-10 rounded-circle mb-3">
            <i className="bi bi-droplet-fill text-warning fs-1"></i>
          </div>
          <h2 className="fw-bold text-white">Crude-X</h2>
          <p className="text-muted">{isRegister ? 'Register your company workspace' : 'Enter credentials to access the system'}</p>
        </div>

        {isRegister ? (
          // Tenant registration form
          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary">Company Name</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-secondary border-opacity-25">
                  <i className="bi bi-building text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-transparent border-start-0 ps-0 border-secondary border-opacity-25 text-white"
                  placeholder="e.g. Chevron Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary">Owner Full Name</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-secondary border-opacity-25">
                  <i className="bi bi-person text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-transparent border-start-0 ps-0 border-secondary border-opacity-25 text-white"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary">Owner Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-secondary border-opacity-25">
                  <i className="bi bi-envelope text-muted"></i>
                </span>
                <input
                  type="email"
                  className="form-control bg-transparent border-start-0 ps-0 border-secondary border-opacity-25 text-white"
                  placeholder="owner@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-secondary">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-secondary border-opacity-25">
                  <i className="bi bi-lock text-muted"></i>
                </span>
                <input
                  type="password"
                  className="form-control bg-transparent border-start-0 ps-0 border-secondary border-opacity-25 text-white"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              ref={submitBtnRef}
              type="submit"
              className="btn btn-warning w-100 py-2.5 fw-bold text-dark d-flex align-items-center justify-content-center mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Provisioning...
                </>
              ) : (
                'Create Workspace'
              )}
            </button>
            <div className="text-center">
              <button 
                type="button" 
                className="btn btn-link text-warning text-decoration-none fw-semibold"
                onClick={() => setIsRegister(false)}
              >
                Already have an account? Log In
              </button>
            </div>
          </form>
        ) : (
          // Normal login form
          <>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 border-secondary border-opacity-25">
                    <i className="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control bg-transparent border-start-0 ps-0 border-secondary border-opacity-25 text-white"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-secondary">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 border-secondary border-opacity-25">
                    <i className="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control bg-transparent border-start-0 ps-0 border-secondary border-opacity-25 text-white"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                ref={submitBtnRef}
                type="submit"
                className="btn btn-warning w-100 py-2.5 fw-bold text-dark d-flex align-items-center justify-content-center mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging In...
                  </>
                ) : (
                  'Login'
                )}
              </button>
              <div className="text-center">
                <button 
                  type="button" 
                  className="btn btn-link text-warning text-decoration-none fw-semibold"
                  onClick={() => setIsRegister(true)}
                >
                  Register a New Company Workspace (SaaS)
                </button>
              </div>
            </form>

            <div className="text-center mt-4 border-top border-secondary border-opacity-25 pt-3">
              <small className="text-muted d-block mb-1">Default Login Accounts (Click to auto-fill):</small>
              <div className="mt-2 text-start p-2 rounded text-xs" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', fontSize: '0.73rem', maxHeight: '180px', overflowY: 'auto' }}>
                <small className="text-warning d-block mb-1 fw-bold text-uppercase" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>Demo Oil Co. (Tenant 1)</small>
                <div 
                  className="text-white-50 py-1 px-2 rounded mb-1 d-flex justify-content-between align-items-center" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => handleQuickFill('admin@crm.com', 'admin123')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <span><strong>Company Admin:</strong> <span className="text-warning text-decoration-underline">admin@crm.com</span> / admin123</span>
                  <i className="bi bi-box-arrow-in-right text-warning opacity-75"></i>
                </div>
                <div 
                  className="text-white-50 py-1 px-2 rounded mb-1 d-flex justify-content-between align-items-center" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => handleQuickFill('manager@crm.com', 'manager123')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <span><strong>Manager:</strong> <span className="text-warning text-decoration-underline">manager@crm.com</span> / manager123</span>
                  <i className="bi bi-box-arrow-in-right text-warning opacity-75"></i>
                </div>
                <div 
                  className="text-white-50 py-1 px-2 rounded mb-1 d-flex justify-content-between align-items-center" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => handleQuickFill('employee@crm.com', 'employee123')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <span><strong>Employee:</strong> <span className="text-warning text-decoration-underline">employee@crm.com</span> / employee123</span>
                  <i className="bi bi-box-arrow-in-right text-warning opacity-75"></i>
                </div>
                
                <small className="text-warning d-block mt-2 mb-1 fw-bold text-uppercase" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>Chevron Corp (Tenant 2)</small>
                <div 
                  className="text-white-50 py-1 px-2 rounded mb-1 d-flex justify-content-between align-items-center" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => handleQuickFill('owner@chevron.com', 'owner123')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <span><strong>Company Admin:</strong> <span className="text-warning text-decoration-underline">owner@chevron.com</span> / owner123</span>
                  <i className="bi bi-box-arrow-in-right text-warning opacity-75"></i>
                </div>

                <small className="text-warning d-block mt-2 mb-1 fw-bold text-uppercase" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>Platform Roles & Portals</small>
                <div 
                  className="text-white-50 py-1 px-2 rounded mb-1 d-flex justify-content-between align-items-center" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => handleQuickFill('superadmin@platform.com', 'superadmin123')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <span><strong>Super Admin:</strong> <span className="text-warning text-decoration-underline">superadmin@platform.com</span> / superadmin123</span>
                  <i className="bi bi-box-arrow-in-right text-warning opacity-75"></i>
                </div>
                <div 
                  className="text-white-50 py-1 px-2 rounded d-flex justify-content-between align-items-center" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => handleQuickFill('client@reliance.com', 'client123')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <span><strong>Client Portal:</strong> <span className="text-warning text-decoration-underline">client@reliance.com</span> / client123</span>
                  <i className="bi bi-box-arrow-in-right text-warning opacity-75"></i>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
