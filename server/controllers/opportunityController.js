const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getOpportunities = async (req, res) => {
  const { stage, customer_id, assigned_to } = req.query;

  try {
    let query = `
      SELECT o.*, c.company_name as customer_name, l.title as lead_title, u.name as assigned_user
      FROM opportunities o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN leads l ON o.lead_id = l.lead_id
      JOIN users u ON o.assigned_to = u.user_id
      WHERE 1=1
    `;
    const params = [];

    // Tenant / Client Isolation
    if (req.user.role === 'Client') {
      query += ' AND o.customer_id = ?';
      params.push(req.user.customerId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND o.tenant_id = ?';
      params.push(req.user.tenantId);
    }

    if (stage) {
      query += ' AND o.stage = ?';
      params.push(stage);
    }
    if (customer_id) {
      query += ' AND o.customer_id = ?';
      params.push(customer_id);
    }
    if (assigned_to) {
      query += ' AND o.assigned_to = ?';
      params.push(assigned_to);
    }

    query += ' ORDER BY o.created_at DESC';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createOpportunity = async (req, res) => {
  const { customer_id, lead_id, title, description, expected_value, probability, stage, expected_close_date, assigned_to } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot create opportunities.' });
  }

  if (!customer_id || !title || expected_value === undefined || probability === undefined || !stage || !expected_close_date || !assigned_to) {
    return res.status(400).json({ message: 'Customer, Title, Expected Value, Probability, Stage, Close Date, and Assigned User are required.' });
  }

  try {
    const tenantId = req.user.role === 'SuperAdmin' ? (req.body.tenantId || 1) : req.user.tenantId;

    // Verify customer belongs to same tenant
    if (req.user.role !== 'SuperAdmin') {
      const [check] = await db.query('SELECT tenant_id FROM customers WHERE customer_id = ?', [customer_id]);
      if (check.length === 0 || check[0].tenant_id !== tenantId) {
        return res.status(400).json({ message: 'Invalid customer selection.' });
      }
    }

    const [result] = await db.query(
      `INSERT INTO opportunities (customer_id, lead_id, title, description, expected_value, probability, stage, expected_close_date, assigned_to, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, lead_id || null, title, description || null, expected_value, probability, stage, expected_close_date, assigned_to, tenantId]
    );

    const newOppId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Opportunities', newOppId, tenantId);

    return res.status(201).json({
      message: 'Opportunity created successfully.',
      opportunityId: newOppId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateOpportunity = async (req, res) => {
  const { id } = req.params;
  const { customer_id, lead_id, title, description, expected_value, probability, stage, expected_close_date, assigned_to } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot modify opportunities.' });
  }

  if (!customer_id || !title || expected_value === undefined || probability === undefined || !stage || !expected_close_date || !assigned_to) {
    return res.status(400).json({ message: 'Customer, Title, Expected Value, Probability, Stage, Close Date, and Assigned User are required.' });
  }

  try {
    let query = `
      UPDATE opportunities 
      SET customer_id = ?, lead_id = ?, title = ?, description = ?, expected_value = ?, probability = ?, stage = ?, expected_close_date = ?, assigned_to = ?
      WHERE opportunity_id = ?
    `;
    const params = [customer_id, lead_id || null, title, description || null, expected_value, probability, stage, expected_close_date, assigned_to, id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Opportunity not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Update', 'Opportunities', id, req.user.tenantId || 1);

    return res.json({ message: 'Opportunity updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteOpportunity = async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot delete opportunities.' });
  }

  try {
    let query = 'DELETE FROM opportunities WHERE opportunity_id = ?';
    const params = [id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Opportunity not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Opportunities', id, req.user.tenantId || 1);

    return res.json({ message: 'Opportunity deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
};
