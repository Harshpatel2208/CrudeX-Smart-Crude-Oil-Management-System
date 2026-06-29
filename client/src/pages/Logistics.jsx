import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Logistics = () => {
  const [logistics, setLogistics] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [steppingId, setSteppingId] = useState(null);

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
    status: 'Pending',
    current_latitude: 0.0,
    current_longitude: 0.0,
    progress: 0.0,
    eta: ''
  });

  const statuses = ['Pending', 'In Transit', 'Delivered'];

  const fetchLogisticsAndDropdowns = async () => {
    try {
      setLoading(true);
      // Fetch logistics first
      const logisticsRes = await api.get('/logistics');
      setLogistics(logisticsRes.data);

      // Fetch orders next
      const ordersRes = await api.get('/orders');
      const activeOrders = ordersRes.data.filter(o => o.status === 'Processing' || o.status === 'Shipped' || o.status === 'Delivered');

      // Filter out orders that already have a logistics record
      const linkedOrderIds = new Set(logisticsRes.data.map(l => l.order_id));
      const unlinkedOrders = activeOrders.filter(o => !linkedOrderIds.has(o.order_id));

      setOrders(unlinkedOrders);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve logistics logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogisticsAndDropdowns();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: (name === 'progress' || name === 'current_latitude' || name === 'current_longitude') 
        ? Number(value) 
        : value
    });
  };

  const handleOpenAdd = () => {
    if (orders.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Eligible Orders Found',
        text: 'There are no active orders (Processing/Shipped) available to schedule a dispatch for.',
        confirmButtonColor: '#ffc107'
      });
      return;
    }
    setEditId(null);
    setFormData({
      order_id: orders[0]?.order_id || '',
      transporter_name: '',
      vehicle_number: '',
      tracking_number: `TRK-DISP-${Date.now().toString().slice(-6)}`,
      dispatch_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      status: 'Pending',
      current_latitude: 19.0760,
      current_longitude: 72.8770,
      progress: 0.00,
      eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
      status: log.status,
      current_latitude: log.current_latitude || 0,
      current_longitude: log.current_longitude || 0,
      progress: log.progress || 0,
      eta: log.eta ? log.eta.split('T')[0] : ''
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
      fetchLogisticsAndDropdowns();
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
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete tracking!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/logistics/${id}`);
          Swal.fire('Deleted!', 'Tracking record removed.', 'success');
          fetchLogisticsAndDropdowns();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete record.', 'error');
        }
      }
    });
  };

  // STEP SIMULATOR HANDLER
  const handleStepSimulation = async (id) => {
    setSteppingId(id);
    try {
      const res = await api.post(`/logistics/${id}/step`);
      
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      Toast.fire({
        icon: 'success',
        title: `Shipment advanced to ${res.data.progress}%. Current coords: [${res.data.current_latitude.toFixed(4)}, ${res.data.current_longitude.toFixed(4)}]`
      });

      // Update state local
      setLogistics(prev => prev.map(l => l.logistics_id === id ? {
        ...l,
        progress: res.data.progress,
        current_latitude: res.data.current_latitude,
        current_longitude: res.data.current_longitude,
        status: res.data.status
      } : l));
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to advance transit simulation.', 'error');
    } finally {
      setSteppingId(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Logistics & Shipments Tracker</h2>
          <p className="text-muted text-sm">Monitor oil tanker transits, pipeline flows, and ETA calculations</p>
        </div>
      </div>

      {/* Logistics List */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : logistics.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">No cargo dispatches currently scheduled.</div>
        ) : (
          logistics.map(log => {
            const isDelivered = log.status === 'Delivered';
            const isTransit = log.status === 'In Transit';
            return (
              <div key={log.logistics_id} className="col-12 col-xl-6">
                <div className="card p-4">
                  <div className="d-flex justify-content-between align-items-start border-bottom pb-2 mb-3">
                    <div>
                      <h5 className="fw-bold text-dark m-0">
                        <code>{log.tracking_number}</code>
                        <span className={`badge ms-2 ${
                          isDelivered ? 'bg-success' : isTransit ? 'bg-info' : 'bg-warning text-dark'
                        }`}>{log.status}</span>
                      </h5>
                      <small className="text-muted">Order Ref: <strong>{log.order_number}</strong> ({log.customer_name})</small>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenEdit(log)}>
                        <i className="bi bi-pencil"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(log.logistics_id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div className="row g-2 text-sm mb-3 text-secondary">
                    <div className="col-6"><strong>Transporter:</strong> {log.transporter_name}</div>
                    <div className="col-6"><strong>Vessel/Tanker:</strong> {log.vehicle_number}</div>
                    <div className="col-6"><strong>Departure Date:</strong> {new Date(log.dispatch_date).toLocaleDateString()}</div>
                    <div className="col-6"><strong>Est. Delivery (ETA):</strong> {log.eta ? new Date(log.eta).toLocaleDateString() : 'TBD'}</div>
                  </div>

                  {/* Simulated Geospatial Path Tracker (Premium UI) */}
                  <h6 className="text-xs text-uppercase text-secondary fw-bold mb-3 d-flex justify-content-between">
                    <span>Geospatial Pipeline / Marine Path Tracker</span>
                    <span className="text-warning">{log.progress.toFixed(0)}% Complete</span>
                  </h6>

                  <div className="bg-black bg-opacity-25 rounded p-3 mb-3" style={{ border: '1px solid var(--border-color)' }}>
                    {/* Checkpoints Tracker Timeline */}
                    <div className="d-flex justify-content-between align-items-center position-relative my-4 px-2">
                      {/* Progress Line Background */}
                      <div className="position-absolute w-100 start-0" style={{
                        height: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        top: '14px',
                        zIndex: 1,
                        borderRadius: '2px'
                      }}></div>
                      {/* Active Progress Line */}
                      <div className="position-absolute start-0" style={{
                        height: '4px',
                        backgroundColor: '#ffaa00',
                        width: `${log.progress}%`,
                        top: '14px',
                        zIndex: 2,
                        borderRadius: '2px',
                        transition: 'width-delay 0.4s ease-in-out'
                      }}></div>

                      {/* Steps */}
                      {[
                        { label: 'Booked', threshold: 0, icon: 'bi-file-earmark-check-fill' },
                        { label: 'Dispatched', threshold: 25, icon: 'bi-box-seam-fill' },
                        { label: 'In Transit', threshold: 50, icon: 'bi-truck' },
                        { label: 'Arrived Port', threshold: 75, icon: 'bi-geo-alt-fill' },
                        { label: 'Delivered', threshold: 100, icon: 'bi-check-circle-fill' }
                      ].map((step, idx) => {
                        const isCompleted = log.progress >= step.threshold;
                        return (
                          <div key={idx} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 3 }}>
                            <div className={`d-flex align-items-center justify-content-center rounded-circle`} style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: isCompleted ? '#ffaa00' : '#121625',
                              border: `2px solid ${isCompleted ? '#ffaa00' : 'rgba(255, 255, 255, 0.15)'}`,
                              color: isCompleted ? '#05070f' : '#94a3b8',
                              fontSize: '0.9rem',
                              transition: 'all 0.3s ease-in-out',
                              boxShadow: isCompleted ? '0 0 10px rgba(255, 170, 0, 0.4)' : 'none'
                            }}>
                              <i className={`bi ${step.icon}`}></i>
                            </div>
                            <span className="mt-2 fw-semibold text-xs text-uppercase" style={{
                              fontSize: '0.65rem',
                              letterSpacing: '0.5px',
                              color: isCompleted ? '#f8fafc' : '#64748b'
                            }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <hr className="my-3 opacity-10" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }} />

                    <div className="d-flex justify-content-between text-xs text-muted mb-2">
                      <div><strong>GPS:</strong> [{log.current_latitude.toFixed(6)}, {log.current_longitude.toFixed(6)}]</div>
                      <div><strong>Destination Hub:</strong> refinery port</div>
                    </div>

                    {/* Path graphic */}
                    <div className="position-relative py-3 my-2 bg-dark rounded overflow-hidden" style={{ height: '40px' }}>
                      {/* Dashed route line */}
                      <div className="position-absolute w-100" style={{
                        borderTop: '2px dashed rgba(255, 193, 7, 0.25)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1
                      }}></div>
                      {/* Completed progress line */}
                      <div className="position-absolute" style={{
                        borderTop: '2px solid #ffc107',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: `${log.progress}%`,
                        zIndex: 2,
                        transition: 'width 0.5s ease-in-out'
                      }}></div>

                      {/* Moving Vessel Icon */}
                      <div className="position-absolute text-warning" style={{
                        left: `${Math.min(95, log.progress)}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 3,
                        transition: 'left 0.5s ease-in-out',
                        fontSize: '1.2rem'
                      }}>
                        <i className={`bi ${
                          log.vehicle_number.toLowerCase().includes('tanker') || log.vehicle_number.toLowerCase().includes('imo')
                            ? 'bi-ship-cruise' 
                            : 'bi-truck'
                        }`}></i>
                      </div>
                    </div>

                    {/* Step simulator button */}
                    {!isDelivered && (
                      <div className="text-end">
                        <button 
                          className="btn btn-warning btn-sm fw-bold text-dark d-inline-flex align-items-center gap-1"
                          onClick={() => handleStepSimulation(log.logistics_id)}
                          disabled={steppingId === log.logistics_id}
                        >
                          {steppingId === log.logistics_id ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <i className="bi bi-play-circle-fill"></i>
                          )}
                          Step Cargo Transit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-warning text-dark rounded-top-4">
                <h5 className="modal-title fw-bold">{editId ? '📝 Update Dispatch State' : '➕ Record Logistics Dispatch'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
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
                      <input type="text" className="form-control" name="transporter_name" value={formData.transporter_name} onChange={handleInputChange} placeholder="e.g. Ocean Cargo" required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Vehicle or Tanker Number</label>
                      <input type="text" className="form-control" name="vehicle_number" value={formData.vehicle_number} onChange={handleInputChange} placeholder="e.g. IMO-9812736 (Tanker)" required />
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
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">GPS Latitude</label>
                      <input type="number" step="any" className="form-control" name="current_latitude" value={formData.current_latitude} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">GPS Longitude</label>
                      <input type="number" step="any" className="form-control" name="current_longitude" value={formData.current_longitude} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Transit Progress (%)</label>
                      <input type="number" min="0" max="100" className="form-control" name="progress" value={formData.progress} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Dispatch Date</label>
                      <input type="date" className="form-control" name="dispatch_date" value={formData.dispatch_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Est. Delivery Date (ETA)</label>
                      <input type="date" className="form-control" name="eta" value={formData.eta} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning fw-bold text-dark px-4">Save Cargo</button>
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
