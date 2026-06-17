const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getCustomers = async (req, res) => {
  const { search, status } = req.query;

  try {
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

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

  if (!company_name || !contact_person || !phone || !email || !address || !city || !state || !country) {
    return res.status(400).json({ message: 'All fields except GST Number and Status are required.' });
  }

  try {
    const custStatus = status !== undefined ? status : 1;
    const [result] = await db.query(
      `INSERT INTO customers (company_name, contact_person, phone, email, gst_number, address, city, state, country, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_name, contact_person, phone, email, gst_number || null, address, city, state, country, custStatus]
    );

    const newCustomerId = result.insertId;

    // Log activity
    await logActivity(req.user.userId, 'Add', 'Customers', newCustomerId);

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

  if (!company_name || !contact_person || !phone || !email || !address || !city || !state || !country) {
    return res.status(400).json({ message: 'All fields except GST Number are required.' });
  }

  try {
    const custStatus = status !== undefined ? status : 1;
    const [result] = await db.query(
      `UPDATE customers 
       SET company_name = ?, contact_person = ?, phone = ?, email = ?, gst_number = ?, address = ?, city = ?, state = ?, country = ?, status = ?
       WHERE customer_id = ?`,
      [company_name, contact_person, phone, email, gst_number || null, address, city, state, country, custStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    // Log activity
    await logActivity(req.user.userId, 'Update', 'Customers', id);

    return res.json({ message: 'Customer updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM customers WHERE customer_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    // Log activity
    await logActivity(req.user.userId, 'Delete', 'Customers', id);

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
