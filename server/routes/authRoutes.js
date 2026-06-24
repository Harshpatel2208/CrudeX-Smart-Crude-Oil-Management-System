const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register-tenant', authController.register); // Public route for new company signups

// Staff invitation and management (accessible by CompanyAdmin or SuperAdmin)
router.post('/register', authenticateToken, authorizeRoles('CompanyAdmin', 'SuperAdmin'), authController.register);
router.get('/profile', authenticateToken, authController.profile);
router.get('/users', authenticateToken, authController.getUsers);

// Admin-only user management routes
router.get('/users/all', authenticateToken, authorizeRoles('CompanyAdmin', 'SuperAdmin'), authController.getAllUsers);
router.put('/users/:id', authenticateToken, authorizeRoles('CompanyAdmin', 'SuperAdmin'), authController.updateUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('CompanyAdmin', 'SuperAdmin'), authController.deleteUser);

module.exports = router;
