import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    status: 1
  });

  const roles = ['CompanyAdmin', 'Manager', 'Employee', 'Client'];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users/all');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve team members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'status' ? Number(value) : value
    });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Employee',
      status: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditId(user.user_id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        // Update user
        await api.put(`/auth/users/${editId}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status
        });
        Swal.fire('Updated!', 'User updated successfully.', 'success');
      } else {
        // Register user
        if (!formData.password) {
          Swal.fire('Error', 'Password is required to add new user.', 'error');
          return;
        }
        await api.post('/auth/register', formData);
        Swal.fire('Registered!', 'User added successfully.', 'success');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save user.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This user will be permanently removed from the system.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete member!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/auth/users/${id}`);
          Swal.fire('Deleted!', 'User has been deleted.', 'success');
          fetchUsers();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', err.response?.data?.message || 'Failed to delete user.', 'error');
        }
      }
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Team & Tenant Management</h2>
          <p className="text-muted text-sm">Register new staff accounts, manage roles, and review status</p>
        </div>
        <button className="btn btn-warning fw-bold text-dark" onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i> Add Workspace User
        </button>
      </div>

      {/* Team Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email Address</th>
                  <th>System Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border text-warning" role="status"></div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No users found.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.user_id}>
                      <td className="fw-bold text-dark">{u.name}</td>
                      <td><code>{u.email}</code></td>
                      <td>
                        <span className={`badge ${
                          u.role === 'CompanyAdmin' ? 'bg-danger text-white' : u.role === 'Manager' ? 'bg-primary text-white' : u.role === 'Client' ? 'bg-info text-white' : 'bg-success text-white'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.status ? 'bg-success' : 'bg-secondary'}`}>
                          {u.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(u)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.user_id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-warning text-dark rounded-top-4">
                <h5 className="modal-title fw-bold">{editId ? '📝 Edit Member details' : '➕ Register Workspace User'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Full Name</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. John Doe" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Email Address</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} placeholder="e.g. john@company.com" required />
                    </div>
                    
                    {!editId && (
                      <div className="col-12">
                        <label className="form-label fw-semibold">Login Password</label>
                        <input type="password" className="form-control" name="password" value={formData.password} onChange={handleInputChange} placeholder="Enter temporary password" required />
                      </div>
                    )}

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">System Role</label>
                      <select className="form-select" name="role" value={formData.role} onChange={handleInputChange}>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning fw-bold text-dark px-4">{editId ? 'Save Member' : 'Register User'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
