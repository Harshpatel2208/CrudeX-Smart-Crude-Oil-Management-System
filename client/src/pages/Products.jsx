import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    category: 'Crude Oil',
    unit_price: 0,
    stock_quantity: 0,
    description: '',
    status: 1
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: (name === 'unit_price' || name === 'stock_quantity' || name === 'status') ? Number(value) : value
    });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      product_name: '',
      product_code: '',
      category: 'Crude Oil',
      unit_price: '',
      stock_quantity: '',
      description: '',
      status: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditId(product.product_id);
    setFormData({
      product_name: product.product_name,
      product_code: product.product_code,
      category: product.category,
      unit_price: product.unit_price,
      stock_quantity: product.stock_quantity,
      description: product.description || '',
      status: product.status
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/products/${editId}`, formData);
        Swal.fire('Updated!', 'Product details updated.', 'success');
      } else {
        await api.post('/products', formData);
        Swal.fire('Created!', 'Product created successfully.', 'success');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save product.', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the product and all associated logs.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/products/${id}`);
          Swal.fire('Deleted!', 'Product has been deleted.', 'success');
          fetchProducts();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete product.', 'error');
        }
      }
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Crude Oil Products</h2>
          <p className="text-muted text-sm">Monitor oil grade lists, contract prices, and real-time inventory tracking</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i> Add Product
        </button>
      </div>

      {/* Stock warning notifications */}
      {products.some(p => p.low_stock) && (
        <div className="alert alert-warning border-0 shadow-sm rounded-3 d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-4 me-3 text-warning"></i>
          <div>
            <strong>Low Stock Alert:</strong> Certain crude oil grades are falling below the safety threshold of <strong>5,000 barrels</strong>. Please review stock volumes.
          </div>
        </div>
      )}

      {/* Product List Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Unit Price (₹)</th>
                  <th>Stock Quantity</th>
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
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No products configured.</td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.product_id} className={p.low_stock ? 'table-warning-subtle' : ''}>
                      <td>
                        <div className="fw-bold text-dark">{p.product_name}</div>
                        <small className="text-muted">{p.description || 'No description'}</small>
                      </td>
                      <td><code>{p.product_code}</code></td>
                      <td>{p.category}</td>
                      <td className="fw-semibold">₹{Number(p.unit_price).toLocaleString()}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`fw-bold ${p.low_stock ? 'text-danger' : 'text-success'}`}>
                            {Number(p.stock_quantity).toLocaleString()} units
                          </span>
                          {p.low_stock && (
                            <span className="badge bg-danger rounded-pill py-1 text-xs">Low Stock</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${p.status ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                          {p.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(p)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.product_id)}>
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
                <h5 className="modal-title fw-bold">{editId ? '📝 Edit Product Info' : '➕ Add Product'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Product Name</label>
                      <input type="text" className="form-control" name="product_name" value={formData.product_name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Product Code</label>
                      <input type="text" className="form-control" name="product_code" value={formData.product_code} onChange={handleInputChange} placeholder="e.g. CR-BRENT" required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Category</label>
                      <input type="text" className="form-control" name="category" value={formData.category} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Unit Price (₹)</label>
                      <input type="number" className="form-control" name="unit_price" value={formData.unit_price} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Stock Quantity (Barrels/Units)</label>
                      <input type="number" className="form-control" name="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Product Description</label>
                      <textarea className="form-control" name="description" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">Save Product</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
