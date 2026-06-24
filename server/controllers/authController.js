const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'crude_oil_crm_secret_key_2026_super_secure';

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (!user.status) {
      return res.status(403).json({ message: 'Your account is deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { 
        userId: user.user_id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenant_id,
        customerId: user.customer_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Record login activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, module, record_id, tenant_id) VALUES (?, ?, ?, ?, ?)',
      [user.user_id, 'Login', 'Auth', user.user_id, user.tenant_id || 1]
    );

    return res.json({
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        customerId: user.customer_id
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const register = async (req, res) => {
  const { name, email, password, role, companyName, tenantId, customerId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let resolvedTenantId = null;
    let resolvedRole = role || 'Employee';

    // 1. Tenant Self-Signup Flow
    if (companyName) {
      const [tenantResult] = await db.query(
        'INSERT INTO tenants (company_name, owner_email, status) VALUES (?, ?, ?)',
        [companyName, email, 'Active']
      );
      resolvedTenantId = tenantResult.insertId;
      resolvedRole = 'CompanyAdmin';
    } 
    // 2. Normal team user creation
    else {
      if (req.user) {
        if (req.user.role === 'SuperAdmin') {
          resolvedTenantId = tenantId || null;
        } else {
          resolvedTenantId = req.user.tenantId;
        }
      } else {
        // Fallback for demo seeds
        resolvedTenantId = 1;
      }
    }

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, tenant_id, customer_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, resolvedRole, resolvedTenantId, customerId || null]
    );

    const newUserId = result.insertId;

    // Log registration
    const activeUserId = req.user ? req.user.userId : newUserId;
    await db.query(
      'INSERT INTO activity_logs (user_id, action, module, record_id, tenant_id) VALUES (?, ?, ?, ?, ?)',
      [activeUserId, 'Add', 'Users', newUserId, resolvedTenantId || 1]
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      userId: newUserId,
      tenantId: resolvedTenantId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const profile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, name, email, role, tenant_id, customer_id, status, created_at FROM users WHERE user_id = ?', 
      [req.user.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getUsers = async (req, res) => {
  try {
    let query = 'SELECT user_id, name, email, role, tenant_id, status FROM users WHERE status = 1';
    const params = [];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    query += ' ORDER BY name ASC';
    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    let query = 'SELECT user_id, name, email, role, tenant_id, status, created_at FROM users';
    const params = [];

    if (req.user.role !== 'SuperAdmin') {
      query += ' WHERE tenant_id = ?';
      params.push(req.user.tenantId);
    }

    query += ' ORDER BY name ASC';
    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required.' });
  }

  try {
    // Verify user ownership/tenant matching
    if (req.user.role !== 'SuperAdmin') {
      const [check] = await db.query('SELECT tenant_id FROM users WHERE user_id = ?', [id]);
      if (check.length === 0 || check[0].tenant_id !== req.user.tenantId) {
        return res.status(403).json({ message: 'Access denied. User belongs to another tenant.' });
      }
    }

    const [result] = await db.query(
      'UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE user_id = ?',
      [name, email, role, status !== undefined ? status : 1, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await db.query(
      'INSERT INTO activity_logs (user_id, action, module, record_id, tenant_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, 'Update', 'Users', id, req.user.tenantId || 1]
    );

    return res.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    if (Number(id) === req.user.userId) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    // Verify user ownership/tenant matching
    if (req.user.role !== 'SuperAdmin') {
      const [check] = await db.query('SELECT tenant_id FROM users WHERE user_id = ?', [id]);
      if (check.length === 0 || check[0].tenant_id !== req.user.tenantId) {
        return res.status(403).json({ message: 'Access denied. User belongs to another tenant.' });
      }
    }

    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await db.query(
      'INSERT INTO activity_logs (user_id, action, module, record_id, tenant_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, 'Delete', 'Users', id, req.user.tenantId || 1]
    );

    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  login,
  register,
  profile,
  getUsers,
  getAllUsers,
  updateUser,
  deleteUser
};
