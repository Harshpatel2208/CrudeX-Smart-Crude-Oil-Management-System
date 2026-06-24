const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getInvoices = async (req, res) => {
  try {
    let query = `
      SELECT inv.*, c.company_name as customer_name, o.order_number
      FROM invoices inv
      JOIN customers c ON inv.customer_id = c.customer_id
      JOIN orders o ON inv.order_id = o.order_id
      WHERE 1=1
    `;
    const params = [];

    // Tenant / Client Isolation
    if (req.user.role === 'Client') {
      query += ' AND inv.customer_id = ?';
      params.push(req.user.customerId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND inv.tenant_id = ?';
      params.push(req.user.tenantId);
    }

    query += ' ORDER BY inv.invoice_date DESC';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getInvoiceById = async (req, res) => {
  const { id } = req.params;

  try {
    let query = `
      SELECT inv.*, c.company_name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address, c.city as customer_city, c.state as customer_state, c.country as customer_country, o.order_number, o.order_date
      FROM invoices inv
      JOIN customers c ON inv.customer_id = c.customer_id
      JOIN orders o ON inv.order_id = o.order_id
      WHERE inv.invoice_id = ?
    `;
    const params = [id];

    if (req.user.role === 'Client') {
      query += ' AND inv.customer_id = ?';
      params.push(req.user.customerId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND inv.tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [invRows] = await db.query(query, params);

    if (invRows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found or access denied.' });
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

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot create invoices.' });
  }

  if (!invoice_number || !customer_id || !order_id || amount === undefined || tax_amount === undefined || !invoice_date) {
    return res.status(400).json({ message: 'Invoice Number, Customer, Order, Amount, Tax Amount, and Invoice Date are required.' });
  }

  try {
    const tenantId = req.user.role === 'SuperAdmin' ? (req.body.tenantId || 1) : req.user.tenantId;

    // Verify order exists and belongs to same tenant
    if (req.user.role !== 'SuperAdmin') {
      const [checkOrder] = await db.query('SELECT tenant_id FROM orders WHERE order_id = ?', [order_id]);
      if (checkOrder.length === 0 || checkOrder[0].tenant_id !== tenantId) {
        return res.status(400).json({ message: 'Invalid order selection.' });
      }
    }

    const totalAmount = Number(amount) + Number(tax_amount);
    const payStatus = payment_status || 'Unpaid';

    const [result] = await db.query(
      `INSERT INTO invoices (invoice_number, customer_id, order_id, amount, tax_amount, total_amount, payment_status, invoice_date, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoice_number, customer_id, order_id, amount, tax_amount, totalAmount, payStatus, invoice_date, tenantId]
    );

    const newInvoiceId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Invoices', newInvoiceId, tenantId);

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

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot modify invoices.' });
  }

  if (!invoice_number || !customer_id || !order_id || amount === undefined || tax_amount === undefined || !invoice_date) {
    return res.status(400).json({ message: 'Invoice Number, Customer, Order, Amount, Tax Amount, and Invoice Date are required.' });
  }

  try {
    const tenantId = req.user.tenantId || 1;

    // Verify invoice matches tenant
    if (req.user.role !== 'SuperAdmin') {
      const [check] = await db.query('SELECT tenant_id FROM invoices WHERE invoice_id = ?', [id]);
      if (check.length === 0 || check[0].tenant_id !== tenantId) {
        return res.status(404).json({ message: 'Invoice not found or access denied.' });
      }
    }

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

    await logActivity(req.user.userId, 'Update', 'Invoices', id, req.user.tenantId || 1);

    return res.json({ message: 'Invoice updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteInvoice = async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot delete invoices.' });
  }

  try {
    let query = 'DELETE FROM invoices WHERE invoice_id = ?';
    const params = [id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Invoices', id, req.user.tenantId || 1);

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
