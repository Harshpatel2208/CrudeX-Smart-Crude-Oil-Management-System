import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    contract_number: '',
    contract_value: 0,
    start_date: '',
    end_date: '',
    status: 'Draft'
  });

  const statuses = ['Draft', 'Active', 'Expired', 'Cancelled'];

  const fetchDropdowns = async () => {
    try {
      const res = await api.get('/customers?status=1');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contracts');
      setContracts(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve agreements list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchContracts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'contract_value' ? Number(value) : value
    });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      customer_id: customers[0]?.customer_id || '',
      contract_number: '',
      contract_value: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'Draft'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (contract) => {
    setEditId(contract.contract_id);
    setFormData({
      customer_id: contract.customer_id,
      contract_number: contract.contract_number,
      contract_value: contract.contract_value,
      start_date: contract.start_date.split('T')[0],
      end_date: contract.end_date.split('T')[0],
      status: contract.status
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/contracts/${editId}`, formData);
        Swal.fire('Updated!', 'Agreement details updated.', 'success');
      } else {
        await api.post('/contracts', formData);
        Swal.fire('Created!', 'Agreement logged successfully.', 'success');
      }
      setShowModal(false);
      fetchContracts();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save agreement.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the agreement from the database.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/contracts/${id}`);
          Swal.fire('Deleted!', 'Agreement has been deleted.', 'success');
          fetchContracts();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete agreement.', 'error');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return 'bg-success-subtle text-success';
      case 'Draft': return 'bg-primary-subtle text-primary';
      case 'Expired': return 'bg-danger-subtle text-danger';
      case 'Cancelled': return 'bg-secondary-subtle text-secondary';
      default: return 'bg-light text-dark';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Agreements & Contracts</h2>
          <p className="text-muted text-sm">Register customer supply contracts, active status codes, and values</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i> New Contract
        </button>
      </div>

      {/* Contract Listing */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Contract Number</th>
                  <th>Customer</th>
                  <th>Contract Value (₹)</th>
                  <th>Term Period</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status"></div>
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No contracts filed.</td>
                  </tr>
                ) : (
                  contracts.map(c => (
                    <tr key={c.contract_id}>
                      <td className="fw-bold text-dark"><code>{c.contract_number}</code></td>
                      <td className="fw-semibold">{c.customer_name}</td>
                      <td className="fw-semibold text-primary">₹{Number(c.contract_value).toLocaleString()}</td>
                      <td>
                        <div className="text-sm">
                          {new Date(c.start_date).toLocaleDateString()} to {new Date(c.end_date).toLocaleDateString()}
                        </div>
                        <small className="text-muted text-xs">
                          {Math.round((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                        </small>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(c)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.contract_id)}>
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
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title fw-bold">{editId ? '📝 Edit Contract details' : '➕ Add Contract Agreement'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Contract Number</label>
                      <input type="text" className="form-control" name="contract_number" value={formData.contract_number} onChange={handleInputChange} placeholder="e.g. CON-2026-005" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Customer Account</label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleInputChange} required>
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.company_name}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Contract Value (₹)</label>
                      <input type="number" className="form-control" name="contract_value" value={formData.contract_value} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Start Date</label>
                      <input type="date" className="form-control" name="start_date" value={formData.start_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">End Date</label>
                      <input type="date" className="form-control" name="end_date" value={formData.end_date} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Save Contract</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
