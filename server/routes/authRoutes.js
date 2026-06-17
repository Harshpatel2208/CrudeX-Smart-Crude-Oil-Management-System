const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authenticateToken, authorizeRoles('Admin'), authController.register); // Admin only can register other users now!
router.get('/profile', authenticateToken, authController.profile);
router.get('/users', authenticateToken, authController.getUsers);

// Admin-only user management routes
router.get('/users/all', authenticateToken, authorizeRoles('Admin'), authController.getAllUsers);
router.put('/users/:id', authenticateToken, authorizeRoles('Admin'), authController.updateUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('Admin'), authController.deleteUser);

module.exports = router;
