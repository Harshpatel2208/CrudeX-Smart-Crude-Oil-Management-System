import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import './Invoices.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_id: '',
    order_id: '',
    amount: 0,
    tax_amount: 0,
    payment_status: 'Unpaid',
    invoice_date: ''
  });

  const statuses = ['Unpaid', 'Partial', 'Paid'];

  const fetchDropdowns = async () => {
    try {
      const [custRes, orderRes] = await Promise.all([
        api.get('/customers?status=1'),
        api.get('/orders')
      ]);
      setCustomers(custRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      console.error('Failed to load selection lists:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve invoices list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchInvoices();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };

    // Auto-fill amount when order changes
    if (name === 'order_id') {
      const order = orders.find(o => o.order_id === Number(value));
      if (order) {
        updatedForm['amount'] = Number(order.total_amount);
        updatedForm['tax_amount'] = Number(order.total_amount) * 0.05; // Default 5% tax estimate
        updatedForm['customer_id'] = order.customer_id; // Set client auto
      }
    }

    setFormData(updatedForm);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      invoice_number: `INV-2026-${Date.now().toString().slice(-4)}`,
      customer_id: customers[0]?.customer_id || '',
      order_id: '',
      amount: '',
      tax_amount: '',
      payment_status: 'Unpaid',
      invoice_date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (inv) => {
    setEditId(inv.invoice_id);
    setFormData({
      invoice_number: inv.invoice_number,
      customer_id: inv.customer_id,
      order_id: inv.order_id,
      amount: inv.amount,
      tax_amount: inv.tax_amount,
      payment_status: inv.payment_status,
      invoice_date: inv.invoice_date.split('T')[0]
    });
    setShowModal(true);
  };

  const handleOpenPrint = async (invId) => {
    try {
      const res = await api.get(`/invoices/${invId}`);
      setSelectedInvoice(res.data);
      setShowPrintView(true);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to load print invoice data.', 'error');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/invoices/${editId}`, formData);
        Swal.fire('Updated!', 'Invoice updated successfully.', 'success');
      } else {
        await api.post('/invoices', formData);
        Swal.fire('Created!', 'Invoice generated successfully.', 'success');
      }
      setShowModal(false);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save invoice.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Deleting this invoice will remove all related payments.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete invoice!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/invoices/${id}`);
          Swal.fire('Deleted!', 'Invoice has been deleted.', 'success');
          fetchInvoices();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete invoice.', 'error');
        }
      }
    });
  };

  const triggerPrint = () => {
    window.print();
  };

  const triggerDownloadPDF = () => {
    const element = document.getElementById('printable-invoice-card');
    const opt = {
      margin:       0.4,
      filename:     `Invoice_${selectedInvoice.invoice_number}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'Partial': return 'bg-warning text-dark';
      case 'Unpaid': return 'bg-danger-subtle text-danger';
      default: return 'bg-light text-dark';
    }
  };

  if (showPrintView && selectedInvoice) {
    return (
      <div className="bg-white p-4 rounded-4 shadow invoice-print-container" style={{ color: '#0f172a' }}>
        {/* Printable layout */}
        <div className="d-flex justify-content-between align-items-center mb-4 print-hide">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPrintView(false)}>
            <i className="bi bi-arrow-left me-1"></i> Back to list
          </button>
          <div className="d-flex gap-2">
            <button className="btn btn-success btn-sm text-white" onClick={triggerDownloadPDF}>
              <i className="bi bi-file-earmark-pdf me-1"></i> Download PDF
            </button>
            <button className="btn btn-primary btn-sm text-dark" onClick={triggerPrint}>
              <i className="bi bi-printer me-1"></i> Print / Save PDF
            </button>
          </div>
        </div>

        <div id="printable-invoice-card" className="p-3 text-dark bg-white">
          <div className="invoice-header d-flex justify-content-between border-bottom pb-4 mb-4">
            <div>
              <h2 className="fw-bold text-primary mb-1" style={{ color: '#0284c7' }}><i className="bi bi-droplet-fill text-warning me-2"></i>COG-CRM Invoice</h2>
              <div className="text-secondary text-sm">Crude Oil Trading & Management</div>
              <div className="text-muted text-xs">GSTIN: 27AABCC8899D1Z4</div>
            </div>
            <div className="text-end">
              <h4 className="fw-bold text-dark m-0" style={{ color: '#0f172a' }}>{selectedInvoice.invoice_number}</h4>
              <div className="text-sm"><strong>Date:</strong> {new Date(selectedInvoice.invoice_date).toLocaleDateString()}</div>
              <div className="text-sm"><strong>Order No:</strong> {selectedInvoice.order_number}</div>
            </div>
          </div>

          <div className="row mb-5">
            <div className="col-6">
              <h6 className="text-secondary text-xs text-uppercase mb-1">Billed To:</h6>
              <div className="fw-bold text-dark" style={{ color: '#0f172a' }}>{selectedInvoice.customer_name}</div>
              <div className="text-muted text-sm">{selectedInvoice.customer_address}</div>
              <div className="text-muted text-sm">{selectedInvoice.customer_city}, {selectedInvoice.customer_state}, {selectedInvoice.customer_country}</div>
              <div className="text-muted text-sm">GSTIN: {selectedInvoice.gst_number || '-'}</div>
            </div>
            <div className="col-6 text-end">
              <h6 className="text-secondary text-xs text-uppercase mb-1">Payment Status:</h6>
              <span className={`badge ${getStatusBadge(selectedInvoice.payment_status)} fs-6 px-3 py-1.5`}>{selectedInvoice.payment_status}</span>
            </div>
          </div>

          <h5 className="fw-bold text-dark mb-3" style={{ color: '#0f172a' }}>Invoice Line Items</h5>
          <table className="table table-bordered mb-4 text-dark border-secondary-subtle" style={{ color: '#0f172a', borderColor: '#cbd5e1' }}>
            <thead>
              <tr className="table-light">
                <th style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>Product Code</th>
                <th style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>Product Name</th>
                <th style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>Quantity</th>
                <th style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>Unit Price (₹)</th>
                <th className="text-end" style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items?.map(item => (
                <tr key={item.order_item_id}>
                  <td style={{ color: '#0f172a' }}><code>{item.product_code}</code></td>
                  <td style={{ color: '#0f172a' }}>{item.product_name}</td>
                  <td style={{ color: '#0f172a' }}>{Number(item.quantity).toLocaleString()}</td>
                  <td style={{ color: '#0f172a' }}>₹{Number(item.price).toLocaleString()}</td>
                  <td className="text-end fw-semibold" style={{ color: '#0f172a' }}>₹{Number(item.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="row justify-content-end">
            <div className="col-12 col-md-5">
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span>Subtotal:</span>
                <span className="fw-semibold">₹{Number(selectedInvoice.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span>Tax (GST):</span>
                <span className="fw-semibold">₹{Number(selectedInvoice.tax_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="fw-bold text-dark">Invoice Total:</span>
                <span className="fw-bold text-primary fs-5" style={{ color: '#0284c7' }}>₹{Number(selectedInvoice.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-top text-center text-muted text-xs">
            Thank you for your business! For any billing queries, please write to accounts@crm.com.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Invoice Listing</h2>
          <p className="text-muted text-sm">Issue customer bills, trace payment status, and export PDF prints</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i> Issue Invoice
        </button>
      </div>

      {/* Invoices List */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Customer</th>
                  <th>Order Reference</th>
                  <th>Invoice Date</th>
                  <th>Total Amount (₹)</th>
                  <th>Payment Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status"></div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No invoices currently filed.</td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.invoice_id}>
                      <td className="fw-bold text-dark">
                        <button className="btn btn-link p-0 fw-bold decoration-none text-primary text-sm" onClick={() => handleOpenPrint(inv.invoice_id)}>
                          <code>{inv.invoice_number}</code>
                        </button>
                      </td>
                      <td className="fw-semibold">{inv.customer_name}</td>
                      <td><code>{inv.order_number}</code></td>
                      <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                      <td className="fw-semibold text-primary">₹{Number(inv.total_amount).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(inv.payment_status)}`}>
                          {inv.payment_status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-info me-2" onClick={() => handleOpenPrint(inv.invoice_id)}>
                          <i className="bi bi-printer"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(inv)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(inv.invoice_id)}>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title fw-bold">{editId ? '📝 Edit Invoice Details' : '➕ Generate Invoice billing'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Invoice Number</label>
                      <input type="text" className="form-control" name="invoice_number" value={formData.invoice_number} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Invoice Date</label>
                      <input type="date" className="form-control" name="invoice_date" value={formData.invoice_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Select Order Reference</label>
                      <select className="form-select" name="order_id" value={formData.order_id} onChange={handleInputChange} required>
                        <option value="">Select Order</option>
                        {orders.map(o => <option key={o.order_id} value={o.order_id}>{o.order_number} ({o.customer_name})</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Base Amount (₹)</label>
                      <input type="number" className="form-control" name="amount" value={formData.amount} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Tax Amount (₹)</label>
                      <input type="number" className="form-control" name="tax_amount" value={formData.tax_amount} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Payment Status</label>
                      <select className="form-select" name="payment_status" value={formData.payment_status} onChange={handleInputChange}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Grand Total (₹)</label>
                      <input type="text" className="form-control bg-light" value={(Number(formData.amount || 0) + Number(formData.tax_amount || 0)).toLocaleString()} readOnly />
                    </div>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Save Invoice</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
