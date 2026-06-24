const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getCustomers = async (req, res) => {
  const { search, status } = req.query;

  try {
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    // Tenant / Client Isolation
    if (req.user.role === 'Client') {
      query += ' AND customer_id = ?';
      params.push(req.user.customerId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    if (status !== undefined && status !== '') {
      query += ' AND status = ?';
      params.push(status === 'active' || status === '1' ? 1 : 0);
    }

    if (search) {
      query += ' AND (company_name LIKE ? OR contact_person LIKE ? OR email LIKE ? OR phone LIKE ? OR country LIKE ?)';
      const likeParam = `%${search}%`;
      params.push(likeParam, likeParam, likeParam, likeParam, likeParam);
    }

    query += ' ORDER BY company_name ASC';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createCustomer = async (req, res) => {
  const { company_name, contact_person, phone, email, gst_number, address, city, state, country, status } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot create customer records.' });
  }

  if (!company_name || !contact_person || !phone || !email || !address || !city || !state || !country) {
    return res.status(400).json({ message: 'All fields except GST Number and Status are required.' });
  }

  try {
    const custStatus = status !== undefined ? status : 1;
    const tenantId = req.user.role === 'SuperAdmin' ? (req.body.tenantId || 1) : req.user.tenantId;

    const [result] = await db.query(
      `INSERT INTO customers (company_name, contact_person, phone, email, gst_number, address, city, state, country, status, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_name, contact_person, phone, email, gst_number || null, address, city, state, country, custStatus, tenantId]
    );

    const newCustomerId = result.insertId;

    // Log activity
    await logActivity(req.user.userId, 'Add', 'Customers', newCustomerId, tenantId);

    return res.status(201).json({
      message: 'Customer created successfully.',
      customerId: newCustomerId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { company_name, contact_person, phone, email, gst_number, address, city, state, country, status } = req.body;

  if (req.user.role === 'Client' && Number(id) !== req.user.customerId) {
    return res.status(403).json({ message: 'Forbidden. You can only update your own customer details.' });
  }

  if (!company_name || !contact_person || !phone || !email || !address || !city || !state || !country) {
    return res.status(400).json({ message: 'All fields except GST Number are required.' });
  }

  try {
    const custStatus = status !== undefined ? status : 1;
    const tenantId = req.user.tenantId || 1;
    let query = `UPDATE customers 
                 SET company_name = ?, contact_person = ?, phone = ?, email = ?, gst_number = ?, address = ?, city = ?, state = ?, country = ?, status = ?
                 WHERE customer_id = ?`;
    const params = [company_name, contact_person, phone, email, gst_number || null, address, city, state, country, custStatus, id];

    if (req.user.role !== 'SuperAdmin' && req.user.role !== 'Client') {
      query += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found or access denied.' });
    }

    // Log activity
    await logActivity(req.user.userId, 'Update', 'Customers', id, req.user.role === 'SuperAdmin' ? 1 : tenantId);

    return res.json({ message: 'Customer updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot delete customer records.' });
  }

  try {
    let query = 'DELETE FROM customers WHERE customer_id = ?';
    const params = [id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found or access denied.' });
    }

    // Log activity
    await logActivity(req.user.userId, 'Delete', 'Customers', id, req.user.tenantId || 1);

    return res.json({ message: 'Customer deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
