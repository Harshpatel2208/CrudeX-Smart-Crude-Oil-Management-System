import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form states
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    gst_number: '',
    address: '',
    city: '',
    state: '',
    country: '',
    status: 1
  });

  const [showModal, setShowModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?search=${search}&status=${statusFilter}`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

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
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      gst_number: '',
      address: '',
      city: '',
      state: '',
      country: '',
      status: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (customer) => {
    setEditId(customer.customer_id);
    setFormData({
      company_name: customer.company_name,
      contact_person: customer.contact_person,
      phone: customer.phone,
      email: customer.email,
      gst_number: customer.gst_number || '',
      address: customer.address,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      status: customer.status
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/customers/${editId}`, formData);
        Swal.fire('Updated!', 'Customer updated successfully.', 'success');
      } else {
        await api.post('/customers', formData);
        Swal.fire('Created!', 'Customer added successfully.', 'success');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save customer.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! All associated leads, opportunities, orders, and invoices will be deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/customers/${id}`);
          Swal.fire('Deleted!', 'Customer has been deleted.', 'success');
          fetchCustomers();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete customer.', 'error');
        }
      }
    });
  };

  // CSV Export utility
  const exportCSV = () => {
    if (customers.length === 0) {
      Swal.fire('Info', 'No data to export', 'info');
      return;
    }
    const headers = ['Company Name', 'Contact Person', 'Phone', 'Email', 'GST Number', 'Address', 'City', 'State', 'Country', 'Status'];
    const rows = customers.map(c => [
      c.company_name,
      c.contact_person,
      c.phone,
      c.email,
      c.gst_number || '-',
      `"${c.address.replace(/"/g, '""')}"`,
      c.city,
      c.state,
      c.country,
      c.status ? 'Active' : 'Inactive'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Customer Directory</h2>
          <p className="text-muted text-sm">Create, review, and manage CRM client profiles</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success" onClick={exportCSV}>
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <i className="bi bi-plus-lg me-1"></i> Add Customer
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-8">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by company name, contact, email, country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Email & Phone</th>
                  <th>GST Number</th>
                  <th>Location</th>
                  <th>Status</th>
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
                ) : currentCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No customers found matching queries.</td>
                  </tr>
                ) : (
                  currentCustomers.map(c => (
                    <tr key={c.customer_id}>
                      <td>
                        <div className="fw-bold text-dark">{c.company_name}</div>
                        <small className="text-muted">{c.city}, {c.state}</small>
                      </td>
                      <td>{c.contact_person}</td>
                      <td>
                        <div>{c.email}</div>
                        <small className="text-muted">{c.phone}</small>
                      </td>
                      <td><code>{c.gst_number || '-'}</code></td>
                      <td>{c.country}</td>
                      <td>
                        <span className={`badge ${c.status ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                          {c.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(c)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.customer_id)}>
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

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted text-sm">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, customers.length)} of {customers.length} entries
          </div>
          <nav>
            <ul className="pagination pagination-sm m-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
              </li>
              {[...Array(totalPages).keys()].map(page => (
                <li key={page + 1} className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(page + 1)}>{page + 1}</button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title fw-bold">{editId ? '📝 Edit Customer' : '➕ Add Customer'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Company Name</label>
                      <input type="text" className="form-control" name="company_name" value={formData.company_name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Contact Person</label>
                      <input type="text" className="form-control" name="contact_person" value={formData.contact_person} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Phone Number</label>
                      <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Email Address</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">GST Number (Optional)</label>
                      <input type="text" className="form-control" name="gst_number" value={formData.gst_number} onChange={handleInputChange} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Country</label>
                      <input type="text" className="form-control" name="country" value={formData.country} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Street Address</label>
                      <textarea className="form-control" name="address" rows="2" value={formData.address} onChange={handleInputChange} required></textarea>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">City</label>
                      <input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">State</label>
                      <input type="text" className="form-control" name="state" value={formData.state} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-4">
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
                  <button type="submit" className="btn btn-primary px-4">Save Profile</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
