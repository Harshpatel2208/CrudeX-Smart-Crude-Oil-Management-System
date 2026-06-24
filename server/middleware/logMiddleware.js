const db = require('../config/db');

const logActivity = async (userId, action, module, recordId = null, tenantId = 1) => {
  try {
    const query = 'INSERT INTO activity_logs (user_id, action, module, record_id, tenant_id) VALUES (?, ?, ?, ?, ?)';
    await db.query(query, [userId, action, module, recordId, tenantId]);
  } catch (error) {
    console.error('Failed to write activity log:', error.message);
  }
};

module.exports = { logActivity };
