const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', opportunityController.getOpportunities);
router.post('/', opportunityController.createOpportunity);
router.put('/:id', opportunityController.updateOpportunity);
router.delete('/:id', opportunityController.deleteOpportunity);

module.exports = router;
