const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getInvoices = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT inv.*, c.company_name as customer_name, o.order_number
      FROM invoices inv
      JOIN customers c ON inv.customer_id = c.customer_id
      JOIN orders o ON inv.order_id = o.order_id
      ORDER BY inv.invoice_date DESC
    `);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getInvoiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const [invRows] = await db.query(`
      SELECT inv.*, c.company_name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address, c.city as customer_city, c.state as customer_state, c.country as customer_country, o.order_number, o.order_date
      FROM invoices inv
      JOIN customers c ON inv.customer_id = c.customer_id
      JOIN orders o ON inv.order_id = o.order_id
      WHERE inv.invoice_id = ?
    `, [id]);

    if (invRows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    // Fetch order items to render in invoice
    const [items] = await db.query(`
      SELECT oi.*, p.product_name, p.product_code
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [invRows[0].order_id]);

    const invoiceDetail = {
      ...invRows[0],
      items
    };

    return res.json(invoiceDetail);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createInvoice = async (req, res) => {
  const { invoice_number, customer_id, order_id, amount, tax_amount, payment_status, invoice_date } = req.body;

  if (!invoice_number || !customer_id || !order_id || amount === undefined || tax_amount === undefined || !invoice_date) {
    return res.status(400).json({ message: 'Invoice Number, Customer, Order, Amount, Tax Amount, and Invoice Date are required.' });
  }

  try {
    const totalAmount = Number(amount) + Number(tax_amount);
    const payStatus = payment_status || 'Unpaid';

    const [result] = await db.query(
      `INSERT INTO invoices (invoice_number, customer_id, order_id, amount, tax_amount, total_amount, payment_status, invoice_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoice_number, customer_id, order_id, amount, tax_amount, totalAmount, payStatus, invoice_date]
    );

    const newInvoiceId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Invoices', newInvoiceId);

    return res.status(201).json({
      message: 'Invoice created successfully.',
      invoiceId: newInvoiceId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { invoice_number, customer_id, order_id, amount, tax_amount, payment_status, invoice_date } = req.body;

  if (!invoice_number || !customer_id || !order_id || amount === undefined || tax_amount === undefined || !invoice_date) {
    return res.status(400).json({ message: 'Invoice Number, Customer, Order, Amount, Tax Amount, and Invoice Date are required.' });
  }

  try {
    const totalAmount = Number(amount) + Number(tax_amount);
    const payStatus = payment_status || 'Unpaid';

    const [result] = await db.query(
      `UPDATE invoices 
       SET invoice_number = ?, customer_id = ?, order_id = ?, amount = ?, tax_amount = ?, total_amount = ?, payment_status = ?, invoice_date = ?
       WHERE invoice_id = ?`,
      [invoice_number, customer_id, order_id, amount, tax_amount, totalAmount, payStatus, invoice_date, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    await logActivity(req.user.userId, 'Update', 'Invoices', id);

    return res.json({ message: 'Invoice updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM invoices WHERE invoice_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Invoices', id);

    return res.json({ message: 'Invoice deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};
