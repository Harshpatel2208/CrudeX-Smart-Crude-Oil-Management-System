const db = require('../config/db');

const getActivityLogs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT al.*, u.name as user_name, u.role as user_role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.user_id
      ORDER BY al.timestamp DESC
      LIMIT 100
    `);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getActivityLogs
};
