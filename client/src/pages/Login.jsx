import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-gradient-blue">
      <div className="card shadow-lg p-5 border-0 rounded-4" style={{ maxWidth: '450px', width: '90%', background: 'var(--card-bg)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 bg-warning bg-opacity-10 rounded-circle mb-3">
            <i className="bi bi-droplet-fill text-warning fs-1"></i>
          </div>
          <h2 className="fw-bold text-white">Crude-X</h2>
          <p className="text-muted">Enter credentials to access the system</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-secondary border-opacity-25">
                <i className="bi bi-envelope text-muted"></i>
              </span>
              <input
                type="email"
                className="form-control bg-transparent border-start-0 ps-0 border-secondary border-opacity-25"
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
                className="form-control bg-transparent border-start-0 ps-0 border-secondary border-opacity-25"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-warning w-100 py-2.5 fw-bold text-dark d-flex align-items-center justify-content-center"
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
        </form>

        <div className="text-center mt-4 border-top border-secondary border-opacity-25 pt-3">
          <small className="text-muted d-block">Default Login Accounts:</small>
          <div className="mt-2 text-start p-2 rounded text-xs" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
            <div className="text-white-50"><strong>Admin:</strong> admin@crm.com / admin123</div>
            <div className="text-white-50"><strong>Manager:</strong> manager@crm.com / manager123</div>
            <div className="text-white-50"><strong>Employee:</strong> employee@crm.com / employee123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
