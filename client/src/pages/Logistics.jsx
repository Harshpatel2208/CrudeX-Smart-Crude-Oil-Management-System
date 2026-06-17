import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Logistics = () => {
  const [logistics, setLogistics] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    order_id: '',
    transporter_name: '',
    vehicle_number: '',
    tracking_number: '',
    dispatch_date: '',
    delivery_date: '',
    status: 'Pending'
  });

  const statuses = ['Pending', 'In Transit', 'Delivered'];

  const fetchDropdowns = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders for selection:', err);
    }
  };

  const fetchLogistics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/logistics');
      setLogistics(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve logistics logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchLogistics();
  }, []);

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
      order_id: orders[0]?.order_id || '',
      transporter_name: '',
      vehicle_number: '',
      tracking_number: `TRK-${Date.now().toString().slice(-6)}`,
      dispatch_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      status: 'Pending'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (log) => {
    setEditId(log.logistics_id);
    setFormData({
      order_id: log.order_id,
      transporter_name: log.transporter_name,
      vehicle_number: log.vehicle_number,
      tracking_number: log.tracking_number,
      dispatch_date: log.dispatch_date.split('T')[0],
      delivery_date: log.delivery_date ? log.delivery_date.split('T')[0] : '',
      status: log.status
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/logistics/${editId}`, formData);
        Swal.fire('Updated!', 'Logistics status updated.', 'success');
      } else {
        await api.post('/logistics', formData);
        Swal.fire('Created!', 'Logistics record added.', 'success');
      }
      setShowModal(false);
      fetchLogistics();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save logistics details.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the logistics tracking entry.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete tracking!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/logistics/${id}`);
          Swal.fire('Deleted!', 'Tracking record removed.', 'success');
          fetchLogistics();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete record.', 'error');
        }
      }
    });
  };

  const handleTimelineClick = async (log, targetStatus) => {
    if (log.status === targetStatus) return;

    Swal.fire({
      title: 'Update Shipment Status?',
      text: `Are you sure you want to update status of ${log.tracking_number} to "${targetStatus}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.put(`/logistics/${log.logistics_id}`, {
            order_id: log.order_id,
            transporter_name: log.transporter_name,
            vehicle_number: log.vehicle_number,
            tracking_number: log.tracking_number,
            dispatch_date: log.dispatch_date.split('T')[0],
            delivery_date: targetStatus === 'Delivered' ? new Date().toISOString().split('T')[0] : (log.delivery_date ? log.delivery_date.split('T')[0] : null),
            status: targetStatus
          });
          Swal.fire('Updated!', `Shipment status is now "${targetStatus}".`, 'success');
          fetchLogistics();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', err.response?.data?.message || 'Failed to update shipment status.', 'error');
        }
      }
    });
  };

  const getStatusStepClass = (currentStatus, targetStatus) => {
    const statusMap = { 'Pending': 0, 'In Transit': 1, 'Delivered': 2 };
    const currentStep = statusMap[currentStatus] !== undefined ? statusMap[currentStatus] : 0;
    const targetStep = statusMap[targetStatus];

    if (currentStep >= targetStep) {
      return 'bg-success text-white border-success';
    }
    return 'bg-light text-muted border-secondary-subtle';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Logistics Tracking</h2>
          <p className="text-muted text-sm">Monitor oil tanker shipments, vehicle dispatches, and delivery status</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i> Dispatch Shipment
        </button>
      </div>

      {/* Logistics Cards List */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : logistics.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">No dispatches currently scheduled.</div>
        ) : (
          logistics.map(log => (
            <div key={log.logistics_id} className="col-12 col-xl-6">
              <div className="card p-4">
                <div className="d-flex justify-content-between align-items-start border-bottom pb-2 mb-3">
                  <div>
                    <h5 className="fw-bold text-dark m-0"><code>{log.tracking_number}</code></h5>
                    <small className="text-muted">Order: <strong>{log.order_number}</strong> ({log.customer_name})</small>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenEdit(log)}>
                      <i className="bi bi-pencil"></i> Update
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(log.logistics_id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="row g-2 text-sm mb-4">
                  <div className="col-6"><strong>Carrier:</strong> {log.transporter_name}</div>
                  <div className="col-6"><strong>Vehicle / Tanker:</strong> {log.vehicle_number}</div>
                  <div className="col-6"><strong>Dispatched:</strong> {new Date(log.dispatch_date).toLocaleDateString()}</div>
                  <div className="col-6"><strong>Delivered:</strong> {log.delivery_date ? new Date(log.delivery_date).toLocaleDateString() : 'Pending'}</div>
                </div>

                {/* Interactive Status Steps Timeline */}
                <h6 className="text-xs text-uppercase text-secondary fw-semibold mb-3">Live Shipment Progress (Click step to update)</h6>
                <div className="d-flex justify-content-between align-items-center position-relative px-4 py-2 timeline-container rounded-3">
                  {/* Progress Line */}
                  <div className="position-absolute bg-secondary bg-opacity-25" style={{ height: '3px', top: '50%', left: '50px', right: '50px', transform: 'translateY(-50%)', zIndex: 1 }}></div>
                  <div className="position-absolute" style={{
                    height: '3px',
                    top: '50%',
                    left: '50px',
                    width: log.status === 'Delivered' ? 'calc(100% - 100px)' : log.status === 'In Transit' ? 'calc(50% - 50px)' : '0%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    backgroundColor: 'var(--success-emerald)',
                    transition: 'width 0.4s ease'
                  }}></div>

                  <div className="d-flex flex-column align-items-center" style={{ zIndex: 3 }}>
                    <div 
                      className={`step-circle ${log.status === 'Pending' || log.status === 'In Transit' || log.status === 'Delivered' ? 'active' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleTimelineClick(log, 'Pending')}
                      title="Set to Pending"
                    >
                      1
                    </div>
                    <span className={`step-label ${log.status === 'Pending' || log.status === 'In Transit' || log.status === 'Delivered' ? 'active' : ''}`}>Pending</span>
                  </div>

                  <div className="d-flex flex-column align-items-center" style={{ zIndex: 3 }}>
                    <div 
                      className={`step-circle ${log.status === 'In Transit' || log.status === 'Delivered' ? 'active' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleTimelineClick(log, 'In Transit')}
                      title="Set to In Transit"
                    >
                      2
                    </div>
                    <span className={`step-label ${log.status === 'In Transit' || log.status === 'Delivered' ? 'active' : ''}`}>In Transit</span>
                  </div>

                  <div className="d-flex flex-column align-items-center" style={{ zIndex: 3 }}>
                    <div 
                      className={`step-circle ${log.status === 'Delivered' ? 'active' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleTimelineClick(log, 'Delivered')}
                      title="Set to Delivered"
                    >
                      3
                    </div>
                    <span className={`step-label ${log.status === 'Delivered' ? 'active' : ''}`}>Delivered</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title fw-bold">{editId ? '📝 Update Dispatch State' : '➕ Record Logistics Dispatch'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Select Order Reference</label>
                      <select className="form-select" name="order_id" value={formData.order_id} onChange={handleInputChange} disabled={!!editId} required>
                        <option value="">Select Order</option>
                        {orders.map(o => <option key={o.order_id} value={o.order_id}>{o.order_number} ({o.customer_name})</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Transporter / Carrier Name</label>
                      <input type="text" className="form-control" name="transporter_name" value={formData.transporter_name} onChange={handleInputChange} placeholder="e.g. Blue Dart, Ocean Cargo" required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Vehicle or Tanker Number</label>
                      <input type="text" className="form-control" name="vehicle_number" value={formData.vehicle_number} onChange={handleInputChange} placeholder="e.g. MH-04-1234, Tanker-A1" required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Tracking Identification Code</label>
                      <input type="text" className="form-control" name="tracking_number" value={formData.tracking_number} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Status Stage</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Dispatch Date</label>
                      <input type="date" className="form-control" name="dispatch_date" value={formData.dispatch_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Delivery Date (Optional)</label>
                      <input type="date" className="form-control" name="delivery_date" value={formData.delivery_date} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Save Shipment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logistics;
