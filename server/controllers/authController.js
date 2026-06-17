const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../middleware/logMiddleware');
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
      { userId: user.user_id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Record login activity
    await logActivity(user.user_id, 'Login', 'Auth', user.user_id);

    return res.json({
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'Employee';

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, userRole]
    );

    const newUserId = result.insertId;

    // Log the registration if there is an authenticated user performing it, or if it is the first/public register
    const activeUserId = req.user ? req.user.userId : newUserId;
    await logActivity(activeUserId, 'Add', 'Users', newUserId);

    return res.status(201).json({
      message: 'User registered successfully.',
      userId: newUserId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const profile = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, name, email, role, status, created_at FROM users WHERE user_id = ?', [req.user.userId]);
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
    const [rows] = await db.query('SELECT user_id, name, email, role, status FROM users WHERE status = 1 ORDER BY name ASC');
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, name, email, role, status, created_at FROM users ORDER BY name ASC');
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
    const [result] = await db.query(
      'UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE user_id = ?',
      [name, email, role, status !== undefined ? status : 1, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await logActivity(req.user.userId, 'Update', 'Users', id);

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

    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Users', id);

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
