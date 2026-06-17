import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  // Filter
  const [stageFilter, setStageFilter] = useState('');

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    lead_id: '',
    title: '',
    description: '',
    expected_value: 0,
    probability: 50,
    stage: 'Prospecting',
    expected_close_date: '',
    assigned_to: ''
  });

  const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

  const fetchDropdowns = async () => {
    try {
      const [custRes, leadRes, userRes] = await Promise.all([
        api.get('/customers?status=1'),
        api.get('/leads'),
        api.get('/auth/users')
      ]);
      setCustomers(custRes.data);
      setLeads(leadRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/opportunities?stage=${stageFilter}`);
      setOpportunities(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve opportunities.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [stageFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: (name === 'expected_value' || name === 'probability') ? Number(value) : value
    });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      customer_id: customers[0]?.customer_id || '',
      lead_id: '',
      title: '',
      description: '',
      expected_value: '',
      probability: 50,
      stage: 'Prospecting',
      expected_close_date: new Date().toISOString().split('T')[0],
      assigned_to: users[0]?.user_id || ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (opp) => {
    setEditId(opp.opportunity_id);
    setFormData({
      customer_id: opp.customer_id,
      lead_id: opp.lead_id || '',
      title: opp.title,
      description: opp.description || '',
      expected_value: opp.expected_value,
      probability: opp.probability,
      stage: opp.stage,
      expected_close_date: opp.expected_close_date ? opp.expected_close_date.split('T')[0] : '',
      assigned_to: opp.assigned_to
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/opportunities/${editId}`, formData);
        Swal.fire('Updated!', 'Opportunity updated.', 'success');
      } else {
        await api.post('/opportunities', formData);
        Swal.fire('Created!', 'Opportunity created.', 'success');
      }
      setShowModal(false);
      fetchOpportunities();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save opportunity.', 'error');
    }
  };

  const updateOppStage = async (oppId, newStage) => {
    const opp = opportunities.find(o => o.opportunity_id === oppId);
    if (!opp) return;

    try {
      const payload = {
        customer_id: opp.customer_id,
        lead_id: opp.lead_id,
        title: opp.title,
        description: opp.description,
        expected_value: opp.expected_value,
        probability: newStage === 'Closed Won' ? 100 : newStage === 'Closed Lost' ? 0 : opp.probability,
        stage: newStage,
        expected_close_date: opp.expected_close_date ? opp.expected_close_date.split('T')[0] : '',
        assigned_to: opp.assigned_to
      };

      await api.put(`/opportunities/${oppId}`, payload);
      fetchOpportunities();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update opportunity stage.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the opportunity record.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/opportunities/${id}`);
          Swal.fire('Deleted!', 'Opportunity has been deleted.', 'success');
          fetchOpportunities();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete opportunity.', 'error');
        }
      }
    });
  };

  // Forecast calculations: sum of (Expected Value * Probability / 100)
  const calculateForecast = () => {
    return opportunities.reduce((acc, opp) => {
      return acc + (Number(opp.expected_value) * Number(opp.probability || 0)) / 100;
    }, 0);
  };

  const calculateTotalPipelineValue = () => {
    return opportunities.reduce((acc, opp) => acc + Number(opp.expected_value), 0);
  };

  const getStageColorClass = (stage) => {
    switch (stage) {
      case 'Closed Won': return 'border-success';
      case 'Closed Lost': return 'border-danger';
      case 'Negotiation': return 'border-warning';
      default: return 'border-primary';
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-0">Pipeline Opportunities</h2>
          <p className="text-muted text-sm">Manage potential deals, probability ratings, and stages</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group" role="group">
            <button
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('kanban')}
            >
              <i className="bi bi-kanban me-1"></i> Kanban
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('list')}
            >
              <i className="bi bi-list-task me-1"></i> List View
            </button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            <i className="bi bi-plus-lg me-1"></i> Add Opportunity
          </button>
        </div>
      </div>

      {/* Revenue Forecast Header Summary */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6">
          <div className="card bg-gradient-blue text-white p-3.5 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-white-50 text-xs text-uppercase mb-1">Weighted Revenue Forecast</h6>
                <h3 className="fw-bold m-0">₹{calculateForecast().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <small className="text-white-50 text-xs">Sum of (Expected Value × Probability%)</small>
              </div>
              <div className="fs-1 opacity-50"><i className="bi bi-calculator"></i></div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card p-3.5 border-0">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-muted text-xs text-uppercase mb-1">Total Pipeline Pipeline Value</h6>
                <h3 className="fw-bold m-0 text-dark">₹{calculateTotalPipelineValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <small className="text-muted text-xs">Total expected value of {opportunities.length} pipeline items</small>
              </div>
              <div className="fs-1 text-primary opacity-50"><i className="bi bi-graph-up-arrow"></i></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="card p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <select className="form-select form-select-sm" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="">All Stages</option>
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && !loading && (
        <div className="kanban-board-container pb-3">
          {stages.map(stage => {
            const stageOpps = opportunities.filter(o => o.stage === stage);
            return (
              <div key={stage} className="kanban-column">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark m-0">{stage}</h6>
                  <span className="badge bg-secondary rounded-pill">{stageOpps.length}</span>
                </div>

                <div className="kanban-cards-wrapper overflow-auto" style={{ maxHeight: '600px' }}>
                  {stageOpps.map(opp => (
                    <div key={opp.opportunity_id} className={`kanban-card border-start border-4 ${getStageColorClass(opp.stage)}`}>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="text-xs text-muted fw-bold">{opp.customer_name}</span>
                        <div className="dropdown">
                          <button className="btn btn-link p-0 text-muted" type="button" data-bs-toggle="dropdown">
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow border-0 text-sm">
                            <li><button className="dropdown-item" onClick={() => handleOpenEdit(opp)}>Edit</button></li>
                            <li><button className="dropdown-item text-danger" onClick={() => handleDelete(opp.opportunity_id)}>Delete</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li className="dropdown-header">Move Stage</li>
                            {stages.filter(s => s !== stage).map(s => (
                              <li key={s}><button className="dropdown-item py-1 text-xs" onClick={() => updateOppStage(opp.opportunity_id, s)}>{s}</button></li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <h6 className="fw-bold text-dark mb-2">{opp.title}</h6>
                      <div className="d-flex justify-content-between align-items-center text-xs">
                        <span className="fw-bold text-primary">₹{Number(opp.expected_value).toLocaleString()}</span>
                        <span className="badge bg-warning text-dark">{opp.probability}% Prob</span>
                      </div>
                      <div className="mt-2 border-top pt-2 text-muted text-xs d-flex justify-content-between">
                        <span><i className="bi bi-clock me-1"></i>{new Date(opp.expected_close_date).toLocaleDateString()}</span>
                        <span>Rep: {opp.assigned_user}</span>
                      </div>
                    </div>
                  ))}
                  {stageOpps.length === 0 && (
                    <div className="text-center text-muted py-4 text-xs">No opportunities</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List Table View */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Customer</th>
                    <th>Est. Value</th>
                    <th>Close Date</th>
                    <th>Probability</th>
                    <th>Stage</th>
                    <th>Assigned Representative</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status"></div>
                      </td>
                    </tr>
                  ) : opportunities.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">No opportunities logged.</td>
                    </tr>
                  ) : (
                    opportunities.map(opp => (
                      <tr key={opp.opportunity_id}>
                        <td>
                          <div className="fw-bold text-dark">{opp.title}</div>
                          {opp.lead_title && <small className="text-muted">Lead: {opp.lead_title}</small>}
                        </td>
                        <td className="fw-semibold">{opp.customer_name}</td>
                        <td className="fw-semibold text-primary">₹{Number(opp.expected_value).toLocaleString()}</td>
                        <td>{new Date(opp.expected_close_date).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress w-100" style={{ height: '6px', maxWidth: '80px' }}>
                              <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${opp.probability}%` }}></div>
                            </div>
                            <span>{opp.probability}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            opp.stage === 'Closed Won' ? 'bg-success' : opp.stage === 'Closed Lost' ? 'bg-danger' : 'bg-primary-subtle text-primary'
                          }`}>
                            {opp.stage}
                          </span>
                        </td>
                        <td>{opp.assigned_user}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(opp)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(opp.opportunity_id)}>
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
      )}
      
      {/* Modal Dialog */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title fw-bold">{editId ? '📝 Edit Opportunity' : '➕ Add Opportunity'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Opportunity Title</label>
                      <input type="text" className="form-control" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Brent Crude bulk sale Q3" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Customer Account</label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleInputChange} required>
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.company_name}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Associated Lead (Optional)</label>
                      <select className="form-select" name="lead_id" value={formData.lead_id} onChange={handleInputChange}>
                        <option value="">None (Independent Opportunity)</option>
                        {leads.map(l => <option key={l.lead_id} value={l.lead_id}>{l.title} ({l.customer_name})</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Expected Value (₹)</label>
                      <input type="number" className="form-control" name="expected_value" value={formData.expected_value} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Probability (%)</label>
                      <input type="number" min="0" max="100" className="form-control" name="probability" value={formData.probability} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Stage</label>
                      <select className="form-select" name="stage" value={formData.stage} onChange={handleInputChange}>
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Expected Close Date</label>
                      <input type="date" className="form-control" name="expected_close_date" value={formData.expected_close_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Assign Owner Representative</label>
                      <select className="form-select" name="assigned_to" value={formData.assigned_to} onChange={handleInputChange} required>
                        <option value="">Select User</option>
                        {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description / Notes</label>
                      <textarea className="form-control" name="description" rows="3" value={formData.description} onChange={handleInputChange} placeholder="Details about this deal..."></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Save Deal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Opportunities;
