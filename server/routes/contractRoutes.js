const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.put('/:id/approve', contractController.approveContract);

router.get('/', contractController.getContracts);
router.post('/', contractController.createContract);
router.put('/:id', contractController.updateContract);
router.delete('/:id', contractController.deleteContract);

module.exports = router;
