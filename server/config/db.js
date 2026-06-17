const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : '',
  database: process.env.DB_NAME || 'crm_cogr',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to XAMPP MySQL Database:', process.env.DB_NAME || 'crm_cogr');
    connection.release();
  } catch (error) {
    console.error('Error connecting to MySQL Database:', error.message);
  }
})();

module.exports = pool;
