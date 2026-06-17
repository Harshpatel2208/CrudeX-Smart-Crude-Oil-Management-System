const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getPayments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, inv.invoice_number, c.company_name as customer_name
      FROM payments p
      JOIN invoices inv ON p.invoice_id = inv.invoice_id
      JOIN customers c ON inv.customer_id = c.customer_id
      ORDER BY p.payment_date DESC
    `);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createPayment = async (req, res) => {
  const { invoice_id, amount, payment_mode, transaction_reference, payment_date, remarks } = req.body;

  if (!invoice_id || amount === undefined || !payment_mode || !transaction_reference || !payment_date) {
    return res.status(400).json({ message: 'Invoice, Amount, Payment Mode, Transaction Ref, and Payment Date are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert payment
    const [result] = await connection.query(
      `INSERT INTO payments (invoice_id, amount, payment_mode, transaction_reference, payment_date, remarks) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoice_id, amount, payment_mode, transaction_reference, payment_date, remarks || null]
    );

    const newPaymentId = result.insertId;

    // Recalculate invoice payment status
    await updateInvoicePaymentStatus(connection, invoice_id);

    await connection.commit();

    await logActivity(req.user.userId, 'Add', 'Payments', newPaymentId);

    return res.status(201).json({
      message: 'Payment recorded successfully.',
      paymentId: newPaymentId
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  } finally {
    connection.release();
  }
};

const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { invoice_id, amount, payment_mode, transaction_reference, payment_date, remarks } = req.body;

  if (!invoice_id || amount === undefined || !payment_mode || !transaction_reference || !payment_date) {
    return res.status(400).json({ message: 'Invoice, Amount, Payment Mode, Transaction Ref, and Payment Date are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get old invoice ID in case it changed
    const [oldPayRows] = await connection.query('SELECT invoice_id FROM payments WHERE payment_id = ?', [id]);
    if (oldPayRows.length === 0) {
      throw new Error('Payment not found.');
    }
    const oldInvoiceId = oldPayRows[0].invoice_id;

    // Update payment
    await connection.query(
      `UPDATE payments 
       SET invoice_id = ?, amount = ?, payment_mode = ?, transaction_reference = ?, payment_date = ?, remarks = ?
       WHERE payment_id = ?`,
      [invoice_id, amount, payment_mode, transaction_reference, payment_date, remarks || null, id]
    );

    // Update status for old and new invoice
    await updateInvoicePaymentStatus(connection, oldInvoiceId);
    if (oldInvoiceId !== Number(invoice_id)) {
      await updateInvoicePaymentStatus(connection, invoice_id);
    }

    await connection.commit();

    await logActivity(req.user.userId, 'Update', 'Payments', id);

    return res.json({ message: 'Payment updated successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ message: error.message || 'Internal server error.' });
  } finally {
    connection.release();
  }
};

const deletePayment = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get invoice ID
    const [payRows] = await connection.query('SELECT invoice_id FROM payments WHERE payment_id = ?', [id]);
    if (payRows.length === 0) {
      throw new Error('Payment not found.');
    }
    const invoiceId = payRows[0].invoice_id;

    // Delete payment
    await connection.query('DELETE FROM payments WHERE payment_id = ?', [id]);

    // Update status
    await updateInvoicePaymentStatus(connection, invoiceId);

    await connection.commit();

    await logActivity(req.user.userId, 'Delete', 'Payments', id);

    return res.json({ message: 'Payment deleted successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ message: error.message || 'Internal server error.' });
  } finally {
    connection.release();
  }
};

const getOutstandingReport = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.customer_id,
        c.company_name,
        c.contact_person,
        c.phone,
        COALESCE(SUM(inv.total_amount), 0) as total_invoiced,
        COALESCE(
          (SELECT SUM(p.amount) 
           FROM payments p 
           JOIN invoices i ON p.invoice_id = i.invoice_id 
           WHERE i.customer_id = c.customer_id
          ), 0
        ) as total_paid,
        (COALESCE(SUM(inv.total_amount), 0) - COALESCE(
          (SELECT SUM(p.amount) 
           FROM payments p 
           JOIN invoices i ON p.invoice_id = i.invoice_id 
           WHERE i.customer_id = c.customer_id
          ), 0
        )) as outstanding_amount
      FROM customers c
      LEFT JOIN invoices inv ON c.customer_id = inv.customer_id
      GROUP BY c.customer_id
      ORDER BY outstanding_amount DESC
    `);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Helper function to update payment status
async function updateInvoicePaymentStatus(connection, invoiceId) {
  // Get invoice details
  const [invRows] = await connection.query('SELECT total_amount FROM invoices WHERE invoice_id = ?', [invoiceId]);
  if (invRows.length === 0) return;

  const totalAmount = Number(invRows[0].total_amount);

  // Get sum of payments
  const [payRows] = await connection.query('SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?', [invoiceId]);
  const totalPaid = Number(payRows[0].total_paid || 0);

  let status = 'Unpaid';
  if (totalPaid >= totalAmount) {
    status = 'Paid';
  } else if (totalPaid > 0) {
    status = 'Partial';
  }

  await connection.query('UPDATE invoices SET payment_status = ? WHERE invoice_id = ?', [status, invoiceId]);
}

module.exports = {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getOutstandingReport
};
