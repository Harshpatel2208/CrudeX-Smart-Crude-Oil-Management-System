const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/:id/step', logisticsController.stepLogistics);

router.get('/', logisticsController.getLogistics);
router.post('/', logisticsController.createLogistics);
router.put('/:id', logisticsController.updateLogistics);
router.delete('/:id', logisticsController.deleteLogistics);

module.exports = router;
