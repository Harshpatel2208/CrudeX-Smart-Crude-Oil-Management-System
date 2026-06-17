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

  if (!customer_id || !title || expected_value === undefined || probability === undefined || !stage || !expected_close_date || !assigned_to) {
    return res.status(400).json({ message: 'Customer, Title, Expected Value, Probability, Stage, Close Date, and Assigned User are required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO opportunities (customer_id, lead_id, title, description, expected_value, probability, stage, expected_close_date, assigned_to) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, lead_id || null, title, description || null, expected_value, probability, stage, expected_close_date, assigned_to]
    );

    const newOppId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Opportunities', newOppId);

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

  if (!customer_id || !title || expected_value === undefined || probability === undefined || !stage || !expected_close_date || !assigned_to) {
    return res.status(400).json({ message: 'Customer, Title, Expected Value, Probability, Stage, Close Date, and Assigned User are required.' });
  }

  try {
    const [result] = await db.query(
      `UPDATE opportunities 
       SET customer_id = ?, lead_id = ?, title = ?, description = ?, expected_value = ?, probability = ?, stage = ?, expected_close_date = ?, assigned_to = ?
       WHERE opportunity_id = ?`,
      [customer_id, lead_id || null, title, description || null, expected_value, probability, stage, expected_close_date, assigned_to, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Opportunity not found.' });
    }

    await logActivity(req.user.userId, 'Update', 'Opportunities', id);

    return res.json({ message: 'Opportunity updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteOpportunity = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM opportunities WHERE opportunity_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Opportunity not found.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Opportunities', id);

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
