const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getLeads = async (req, res) => {
  const { status, source, assigned_to } = req.query;

  try {
    let query = `
      SELECT l.*, c.company_name as customer_name, c.contact_person, c.email as customer_email, c.phone as customer_phone, u.name as assigned_user
      FROM leads l
      JOIN customers c ON l.customer_id = c.customer_id
      JOIN users u ON l.assigned_to = u.user_id
      WHERE 1=1
    `;
    const params = [];

    // Tenant / Client Isolation
    if (req.user.role === 'Client') {
      query += ' AND l.customer_id = ?';
      params.push(req.user.customerId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND l.tenant_id = ?';
      params.push(req.user.tenantId);
    }

    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }
    if (source) {
      query += ' AND l.source = ?';
      params.push(source);
    }
    if (assigned_to) {
      query += ' AND l.assigned_to = ?';
      params.push(assigned_to);
    }

    query += ' ORDER BY l.created_at DESC';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createLead = async (req, res) => {
  const { customer_id, title, source, status, assigned_to, remarks } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot create leads.' });
  }

  if (!customer_id || !title || !source || !assigned_to) {
    return res.status(400).json({ message: 'Customer, Title, Source, and Assigned User are required.' });
  }

  try {
    const leadStatus = status || 'New';
    const tenantId = req.user.role === 'SuperAdmin' ? (req.body.tenantId || 1) : req.user.tenantId;

    // Verify customer belongs to same tenant
    if (req.user.role !== 'SuperAdmin') {
      const [check] = await db.query('SELECT tenant_id FROM customers WHERE customer_id = ?', [customer_id]);
      if (check.length === 0 || check[0].tenant_id !== tenantId) {
        return res.status(400).json({ message: 'Invalid customer selection.' });
      }
    }

    const [result] = await db.query(
      `INSERT INTO leads (customer_id, title, source, status, assigned_to, remarks, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, title, source, leadStatus, assigned_to, remarks || null, tenantId]
    );

    const newLeadId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Leads', newLeadId, tenantId);

    return res.status(201).json({
      message: 'Lead created successfully.',
      leadId: newLeadId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateLead = async (req, res) => {
  const { id } = req.params;
  const { customer_id, title, source, status, assigned_to, remarks } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot modify leads.' });
  }

  if (!customer_id || !title || !source || !assigned_to) {
    return res.status(400).json({ message: 'Customer, Title, Source, and Assigned User are required.' });
  }

  try {
    let query = `
      UPDATE leads 
      SET customer_id = ?, title = ?, source = ?, status = ?, assigned_to = ?, remarks = ?
      WHERE lead_id = ?
    `;
    const params = [customer_id, title, source, status, assigned_to, remarks || null, id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Lead not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Update', 'Leads', id, req.user.tenantId || 1);

    return res.json({ message: 'Lead updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteLead = async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot delete leads.' });
  }

  try {
    let query = 'DELETE FROM leads WHERE lead_id = ?';
    const params = [id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Lead not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Leads', id, req.user.tenantId || 1);

    return res.json({ message: 'Lead deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getLeads,
  createLead,
  updateLead,
  deleteLead
};
