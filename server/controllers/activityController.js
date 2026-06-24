const db = require('../config/db');

const getActivityLogs = async (req, res) => {
  try {
    let query = `
      SELECT al.*, u.name as user_name, u.role as user_role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    // Tenant / Client Isolation
    if (req.user.role === 'Client') {
      // Clients see activity logs they trigger, or customer-linked operations
      query += ' AND al.user_id = ?';
      params.push(req.user.userId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND al.tenant_id = ?';
      params.push(req.user.tenantId);
    }

    query += ' ORDER BY al.timestamp DESC LIMIT 100';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getActivityLogs
};
