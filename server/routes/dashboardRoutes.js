const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/stats', dashboardController.getStats);
router.get('/charts', dashboardController.getCharts);
router.get('/market-prices', dashboardController.getMarketPrices);

module.exports = router;
