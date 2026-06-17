import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    customer_id: '',
    opportunity_id: '',
    order_number: '',
    order_date: '',
    status: 'Pending',
    items: [{ product_id: '', quantity: 1, price: 0 }]
  });

  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const fetchDropdowns = async () => {
    try {
      const [custRes, oppRes, prodRes] = await Promise.all([
        api.get('/customers?status=1'),
        api.get('/opportunities'),
        api.get('/products?status=1')
      ]);
      setCustomers(custRes.data);
      setOpportunities(oppRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load dropdown data:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchOrders();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Line item handlers
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Auto-fill price when product changes
    if (field === 'product_id') {
      const product = products.find(p => p.product_id === Number(value));
      if (product) {
        newItems[index]['price'] = Number(product.unit_price);
      }
    }

    setFormData({
      ...formData,
      items: newItems
    });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, price: 0 }]
    });
  };

  const removeLineItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems.length > 0 ? newItems : [{ product_id: '', quantity: 1, price: 0 }]
    });
  };

  // Grand total calculation for form
  const calculateFormTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (Number(item.quantity || 0) * Number(item.price || 0));
    }, 0);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      customer_id: customers[0]?.customer_id || '',
      opportunity_id: '',
      order_number: `ORD-${Date.now().toString().slice(-6)}`,
      order_date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      items: [{ product_id: products[0]?.product_id || '', quantity: 1000, price: products[0]?.unit_price || 0 }]
    });
    setShowModal(true);
  };

  const handleOpenEdit = async (order) => {
    try {
      const res = await api.get(`/orders/${order.order_id}`);
      const details = res.data;
      setEditId(order.order_id);
      setFormData({
        customer_id: details.customer_id,
        opportunity_id: details.opportunity_id || '',
        order_number: details.order_number,
        order_date: details.order_date.split('T')[0],
        status: details.status,
        items: details.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      });
      setShowModal(true);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve order items.', 'error');
    }
  };

  const handleOpenDetail = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrderDetail(res.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to load order details.', 'error');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/orders/${editId}`, formData);
        Swal.fire('Updated!', 'Order details updated.', 'success');
      } else {
        await api.post('/orders', formData);
        Swal.fire('Created!', 'Order booked successfully.', 'success');
      }
      setShowModal(false);
      fetchOrders();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save order.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Deleting this order will restore its items' stock. All associated invoices & logistics will also be deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete order!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/orders/${id}`);
          Swal.fire('Deleted!', 'Order cancelled and deleted.', 'success');
          fetchOrders();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete order.', 'error');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-success';
      case 'Shipped': return 'bg-info text-dark';
      case 'Processing': return 'bg-primary-subtle text-primary';
      case 'Pending': return 'bg-warning-subtle text-warning';
      case 'Cancelled': return 'bg-danger-subtle text-danger';
      default: return 'bg-light text-dark';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Order Management</h2>
          <p className="text-muted text-sm">Draft customer bookings, configure line items, and audit totals</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i> Place Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Grand Total (₹)</th>
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
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No orders logged.</td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.order_id}>
                      <td className="fw-bold text-dark">
                        <button className="btn btn-link p-0 fw-bold decoration-none text-primary text-sm" onClick={() => handleOpenDetail(o.order_id)}>
                          <code>{o.order_number}</code>
                        </button>
                      </td>
                      <td className="fw-semibold">{o.customer_name}</td>
                      <td>{new Date(o.order_date).toLocaleDateString()}</td>
                      <td className="fw-semibold text-primary">₹{Number(o.total_amount).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-info me-2" onClick={() => handleOpenDetail(o.order_id)}>
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(o)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(o.order_id)}>
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

      {/* Detail View Modal */}
      {showDetailModal && selectedOrderDetail && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-dark text-white rounded-top-4">
                <h5 className="modal-title fw-bold">Order Details: {selectedOrderDetail.order_number}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <h6 className="text-secondary text-xs text-uppercase mb-1">Customer Account</h6>
                    <div className="fw-bold">{selectedOrderDetail.customer_name}</div>
                    <div className="text-muted text-sm">{selectedOrderDetail.customer_address}, {selectedOrderDetail.customer_city}</div>
                    <div className="text-muted text-sm">{selectedOrderDetail.customer_phone} | {selectedOrderDetail.customer_email}</div>
                  </div>
                  <div className="col-12 col-md-6 text-md-end">
                    <h6 className="text-secondary text-xs text-uppercase mb-1">Booking Metadata</h6>
                    <div><strong>Date:</strong> {new Date(selectedOrderDetail.order_date).toLocaleDateString()}</div>
                    <div><strong>Status:</strong> <span className={`badge ${getStatusBadge(selectedOrderDetail.status)}`}>{selectedOrderDetail.status}</span></div>
                    {selectedOrderDetail.opportunity_title && (
                      <div><strong>Opportunity:</strong> {selectedOrderDetail.opportunity_title}</div>
                    )}
                  </div>
                </div>

                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Order Line Items</h6>
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>Product Code</th>
                        <th>Product Description</th>
                        <th>Qty (Barrels/Units)</th>
                        <th>Unit Price (₹)</th>
                        <th className="text-end">Line Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderDetail.items.map(item => (
                        <tr key={item.order_item_id}>
                          <td><code>{item.product_code}</code></td>
                          <td>{item.product_name}</td>
                          <td>{Number(item.quantity).toLocaleString()}</td>
                          <td>₹{Number(item.price).toLocaleString()}</td>
                          <td className="text-end fw-semibold text-primary">₹{Number(item.total).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">Grand Total:</td>
                        <td className="text-end fw-bold text-primary fs-5">₹{Number(selectedOrderDetail.total_amount).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer p-3 bg-light rounded-bottom-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title fw-bold">{editId ? '📝 Edit Order Booking' : '➕ Place Order Booking'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Customer Account</label>
                      <select className="form-select" name="customer_id" value={formData.customer_id} onChange={handleInputChange} required>
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.company_name}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Opportunity Association (Optional)</label>
                      <select className="form-select" name="opportunity_id" value={formData.opportunity_id} onChange={handleInputChange}>
                        <option value="">None (Independent Order)</option>
                        {opportunities.map(o => <option key={o.opportunity_id} value={o.opportunity_id}>{o.title} ({o.customer_name})</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Order Reference Number</label>
                      <input type="text" className="form-control" name="order_number" value={formData.order_number} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Order Booking Date</label>
                      <input type="date" className="form-control" name="order_date" value={formData.order_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Order status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark m-0">Line Items</h6>
                    <button type="button" className="btn btn-xs btn-outline-primary py-1 px-2.5 text-xs fw-semibold" onClick={addLineItem}>
                      <i className="bi bi-plus-lg me-1"></i> Add Line
                    </button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} className="row g-2 mb-2 align-items-end border-bottom pb-2">
                      <div className="col-12 col-md-5">
                        <label className="form-label text-xs fw-semibold text-muted mb-1">Product</label>
                        <select className="form-select form-select-sm" value={item.product_id} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} required>
                          <option value="">Select Crude Grade</option>
                          {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} (Stock: {Number(p.stock_quantity).toLocaleString()})</option>)}
                        </select>
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label text-xs fw-semibold text-muted mb-1">Quantity (Units)</label>
                        <input type="number" className="form-control form-control-sm" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} required />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label text-xs fw-semibold text-muted mb-1">Price per Unit (₹)</label>
                        <input type="number" className="form-control form-control-sm" value={item.price} onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))} required />
                      </div>
                      <div className="col-12 col-md-1 text-md-center">
                        <button type="button" className="btn btn-sm btn-outline-danger p-1" onClick={() => removeLineItem(index)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="text-end mt-4 p-3 bg-light rounded-3">
                    <span className="fw-bold text-secondary me-2">Grand Total Amount:</span>
                    <span className="fw-bold text-primary fs-4">₹{calculateFormTotal().toLocaleString()}</span>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Place Order</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
