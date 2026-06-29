import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active query filters
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');

  // Input states for filter fields (applied on button click)
  const [statusInput, setStatusInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [assignedInput, setAssignedInput] = useState('');

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    source: 'Website',
    status: 'New',
    assigned_to: '',
    remarks: ''
  });

  const sources = ['Website', 'Referral', 'Trade Fair', 'Call', 'Email'];
  const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  const fetchDropdowns = async () => {
    try {
      const [custRes, userRes] = await Promise.all([
        api.get('/customers?status=1'),
        api.get('/auth/users')
      ]);
      setCustomers(custRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/leads?status=${statusFilter}&source=${sourceFilter}&assigned_to=${assignedFilter}`);
      setLeads(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load leads list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sourceFilter, assignedFilter]);

  const handleApplyFilters = () => {
    setStatusFilter(statusInput);
    setSourceFilter(sourceInput);
    setAssignedFilter(assignedInput);
  };

  const handleResetFilters = () => {
    setStatusInput('');
    setSourceInput('');
    setAssignedInput('');
    setStatusFilter('');
    setSourceFilter('');
    setAssignedFilter('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      customer_id: customers[0]?.customer_id || '',
      title: '',
      source: 'Website',
      status: 'New',
      assigned_to: users[0]?.user_id || '',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (lead) => {
    setEditId(lead.lead_id);
    setFormData({
      customer_id: lead.customer_id,
      title: lead.title,
      source: lead.source,
      status: lead.status,
      assigned_to: lead.assigned_to,
      remarks: lead.remarks || ''
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/leads/${editId}`, formData);
        Swal.fire('Updated!', 'Lead has been updated.', 'success');
      } else {
        await api.post('/leads', formData);
        Swal.fire('Created!', 'Lead created successfully.', 'success');
      }
      setShowModal(false);
      fetchLeads();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save lead.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/leads/${id}`);
          Swal.fire('Deleted!', 'Lead has been deleted.', 'success');
          fetchLeads();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete lead.', 'error');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New': return 'bg-primary-subtle text-primary';
      case 'Contacted': return 'bg-info-subtle text-info';
      case 'Qualified': return 'bg-success-subtle text-success';
      case 'Proposal Sent': return 'bg-warning-subtle text-warning';
      case 'Won': return 'bg-success';
      case 'Lost': return 'bg-danger-subtle text-danger';
      default: return 'bg-secondary-subtle text-secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Leads Management</h2>
          <p className="text-muted text-sm">Track prospective clients, their sources, and sales assignments</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i> Add Lead
        </button>
      </div>

      {/* Filters Card */}
      <div className="card p-4 mb-4 card-accent-left">
        <div className="d-flex align-items-center mb-3">
          <i className="bi bi-funnel-fill text-warning me-2 fs-5"></i>
          <h5 className="m-0 fw-bold text-white">Filter Leads</h5>
        </div>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label text-secondary text-xs fw-semibold text-uppercase">Status</label>
            <select className="form-select" value={statusInput} onChange={(e) => setStatusInput(e.target.value)}>
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label text-secondary text-xs fw-semibold text-uppercase">Source</label>
            <select className="form-select" value={sourceInput} onChange={(e) => setSourceInput(e.target.value)}>
              <option value="">All Sources</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label text-secondary text-xs fw-semibold text-uppercase">Assigned To</label>
            <select className="form-select" value={assignedInput} onChange={(e) => setAssignedInput(e.target.value)}>
              <option value="">All Assignees</option>
              {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3 d-flex gap-2">
            <button className="btn btn-primary flex-grow-1" onClick={handleApplyFilters}>Apply Filters</button>
            <button className="btn btn-reset flex-grow-1" onClick={handleResetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card">
        <div className="p-4 pb-3 border-bottom border-light border-opacity-10">
          <h5 className="fw-bold text-white mb-0">Leads Database</h5>
          {error && <div className="text-white-50 text-sm mt-2 mb-0">{error}</div>}
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created At</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <div className="spinner-border text-warning" role="status"></div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">No leads found matching current filter choices.</td>
                  </tr>
                ) : (
                  leads.map(l => (
                    <tr key={l.lead_id}>
                      <td>
                        <div className="fw-bold text-white">{l.customer_name}</div>
                        <small className="text-muted">{l.title}</small>
                      </td>
                      <td>{l.contact_person || 'N/A'}</td>
                      <td>{l.customer_email || 'N/A'}</td>
                      <td>{l.customer_phone || 'N/A'}</td>
                      <td>{l.source}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(l.status)}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>{l.assigned_user}</td>
                      <td>{new Date(l.created_at).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-warning me-2" onClick={() => handleOpenEdit(l)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(l.lead_id)}>
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
                <h5 className="modal-title fw-bold text-dark">{editId ? '📝 Edit Lead Info' : '➕ Add Funnel Lead'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Lead Title</label>
                      <input type="text" className="form-control" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Q3 Crude Oil supply inquiry" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Customer Account</label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleInputChange} required>
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.company_name}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Lead Source</label>
                      <select className="form-select" name="source" value={formData.source} onChange={handleInputChange}>
                        {sources.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Lead Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Assign Sales Representative</label>
                      <select className="form-select" name="assigned_to" value={formData.assigned_to} onChange={handleInputChange} required>
                        <option value="">Select User</option>
                        {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Remarks / Requirements</label>
                      <textarea className="form-control" name="remarks" rows="3" value={formData.remarks} onChange={handleInputChange} placeholder="Add detailed notes here..."></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-dark border-top border-light border-opacity-10 rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Save Lead</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
