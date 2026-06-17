import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [outstandingReport, setOutstandingReport] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab View state
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'outstanding'

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: 0,
    payment_mode: 'Bank Transfer',
    transaction_reference: '',
    payment_date: '',
    remarks: ''
  });

  const paymentModes = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card'];

  const fetchDropdowns = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve payments history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOutstandingReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/outstanding');
      setOutstandingReport(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to load outstanding reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    if (activeTab === 'history') {
      fetchPayments();
    } else {
      fetchOutstandingReport();
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? Number(value) : value
    });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      invoice_id: invoices[0]?.invoice_id || '',
      amount: '',
      payment_mode: 'Bank Transfer',
      transaction_reference: '',
      payment_date: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (pay) => {
    setEditId(pay.payment_id);
    setFormData({
      invoice_id: pay.invoice_id,
      amount: pay.amount,
      payment_mode: pay.payment_mode,
      transaction_reference: pay.transaction_reference,
      payment_date: pay.payment_date.split('T')[0],
      remarks: pay.remarks || ''
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/payments/${editId}`, formData);
        Swal.fire('Updated!', 'Payment record updated.', 'success');
      } else {
        await api.post('/payments', formData);
        Swal.fire('Success!', 'Payment logged successfully.', 'success');
      }
      setShowModal(false);
      fetchPayments();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save transaction.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Deleting this payment will restore the outstanding balance on the invoice.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete payment!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/payments/${id}`);
          Swal.fire('Deleted!', 'Payment record deleted.', 'success');
          fetchPayments();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete payment.', 'error');
        }
      }
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Payments Ledger</h2>
          <p className="text-muted text-sm">Review accounts receivables, outstanding balance sheets, and modes</p>
        </div>
        {activeTab === 'history' && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <i className="bi bi-plus-lg me-1"></i> Receive Payment
          </button>
        )}
      </div>

      {/* Tabs Toggles */}
      <ul className="nav nav-tabs border-bottom mb-4">
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-semibold px-4 py-2.5 ${activeTab === 'history' ? 'active border-bottom border-primary border-3 text-primary bg-transparent' : 'text-muted bg-transparent'}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-clock-history me-2"></i> Payment History
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-semibold px-4 py-2.5 ${activeTab === 'outstanding' ? 'active border-bottom border-primary border-3 text-primary bg-transparent' : 'text-muted bg-transparent'}`}
            onClick={() => setActiveTab('outstanding')}
          >
            <i className="bi bi-file-earmark-bar-graph me-2"></i> Outstanding Reports
          </button>
        </li>
      </ul>

      {/* Payment History View */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Customer Account</th>
                    <th>Invoice No.</th>
                    <th>Ref ID</th>
                    <th>Transaction Date</th>
                    <th>Amount Paid (₹)</th>
                    <th>Mode</th>
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
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">No payments logged yet.</td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.payment_id}>
                        <td className="fw-bold text-dark">
                          <div>{p.customer_name}</div>
                          {p.remarks && <small className="text-muted fw-normal">Note: {p.remarks}</small>}
                        </td>
                        <td><code>{p.invoice_number}</code></td>
                        <td><code>{p.transaction_reference}</code></td>
                        <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                        <td className="fw-semibold text-success">₹{Number(p.amount).toLocaleString()}</td>
                        <td>
                          <span className="badge bg-secondary">{p.payment_mode}</span>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(p)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.payment_id)}>
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

      {/* Outstanding Balance Reports View */}
      {activeTab === 'outstanding' && (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Contact Info</th>
                    <th>Total Invoiced Value (₹)</th>
                    <th>Total Paid Value (₹)</th>
                    <th>Outstanding Balance (₹)</th>
                    <th>Risk State</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status"></div>
                      </td>
                    </tr>
                  ) : outstandingReport.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">No client invoice activity.</td>
                    </tr>
                  ) : (
                    outstandingReport.map(rep => (
                      <tr key={rep.customer_id} className={Number(rep.outstanding_amount) > 100000 ? 'table-danger-subtle' : ''}>
                        <td className="fw-bold text-dark">{rep.company_name}</td>
                        <td>
                          <div>{rep.contact_person}</div>
                          <small className="text-muted">{rep.phone}</small>
                        </td>
                        <td className="fw-semibold">₹{Number(rep.total_invoiced).toLocaleString()}</td>
                        <td className="fw-semibold text-success">₹{Number(rep.total_paid).toLocaleString()}</td>
                        <td className="fw-bold text-danger">₹{Number(rep.outstanding_amount).toLocaleString()}</td>
                        <td>
                          {Number(rep.outstanding_amount) > 500000 ? (
                            <span className="badge bg-danger rounded-pill">High Credit Risk</span>
                          ) : Number(rep.outstanding_amount) > 0 ? (
                            <span className="badge bg-warning text-dark rounded-pill">Outstanding Balance</span>
                          ) : (
                            <span className="badge bg-success rounded-pill">Settled Account</span>
                          )}
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
                <h5 className="modal-title fw-bold">{editId ? '📝 Edit Payment Info' : '➕ Receive Customer Payment'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Select Invoice reference</label>
                      <select className="form-select" name="invoice_id" value={formData.invoice_id} onChange={handleInputChange} required>
                        <option value="">Select Invoice</option>
                        {invoices.map(inv => (
                          <option key={inv.invoice_id} value={inv.invoice_id}>
                            {inv.invoice_number} ({inv.customer_name} - Balance: ₹{(Number(inv.total_amount) - Number(inv.amount_paid || 0)).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Amount Received (₹)</label>
                      <input type="number" className="form-control" name="amount" value={formData.amount} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Payment Mode</label>
                      <select className="form-select" name="payment_mode" value={formData.payment_mode} onChange={handleInputChange}>
                        {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Transaction Reference ID</label>
                      <input type="text" className="form-control" name="transaction_reference" value={formData.transaction_reference} onChange={handleInputChange} placeholder="e.g. TXN-1029384" required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Payment Date</label>
                      <input type="date" className="form-control" name="payment_date" value={formData.payment_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Remarks / Memo</label>
                      <textarea className="form-control" name="remarks" rows="2" value={formData.remarks} onChange={handleInputChange}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Receive Payment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
