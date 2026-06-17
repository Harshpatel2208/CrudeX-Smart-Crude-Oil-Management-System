const db = require('../config/db');

const getStats = async (req, res) => {
  try {
    // Total Customers
    const [[{ totalCustomers }]] = await db.query('SELECT COUNT(*) as totalCustomers FROM customers');

    // Total Leads
    const [[{ totalLeads }]] = await db.query('SELECT COUNT(*) as totalLeads FROM leads');

    // Total Opportunities
    const [[{ totalOpportunities }]] = await db.query('SELECT COUNT(*) as totalOpportunities FROM opportunities');

    // Total Orders
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');

    // Total Revenue (sum of all paid/partial invoice amounts)
    const [[{ totalRevenue }]] = await db.query('SELECT COALESCE(SUM(amount), 0) as totalRevenue FROM payments');

    // Pending Deliveries
    const [[{ pendingDeliveries }]] = await db.query("SELECT COUNT(*) as pendingDeliveries FROM logistics WHERE status IN ('Pending', 'In Transit')");

    // Active Contracts
    const [[{ activeContracts }]] = await db.query("SELECT COUNT(*) as activeContracts FROM contracts WHERE status = 'Active'");

    // Total Weighted Pipeline (sum of expected_value * probability / 100)
    const [[{ totalWeightedPipeline }]] = await db.query("SELECT COALESCE(SUM(expected_value * probability / 100), 0) as totalWeightedPipeline FROM opportunities WHERE stage NOT IN ('Closed Won', 'Closed Lost')");

    // Recent Contracts
    const [recentContracts] = await db.query(`
      SELECT con.*, cust.company_name as customer_name
      FROM contracts con
      JOIN customers cust ON con.customer_id = cust.customer_id
      ORDER BY con.created_at DESC
      LIMIT 5
    `);

    // Recent Logistics
    const [recentLogistics] = await db.query(`
      SELECT l.*, o.order_number, c.company_name as customer_name
      FROM logistics l
      JOIN orders o ON l.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY l.created_at DESC
      LIMIT 5
    `);

    return res.json({
      totalCustomers,
      totalLeads,
      totalOpportunities,
      totalOrders,
      totalRevenue,
      pendingDeliveries,
      activeContracts,
      totalWeightedPipeline,
      recentContracts,
      recentLogistics
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getCharts = async (req, res) => {
  try {
    // 1. Monthly Sales (last 6 months)
    const monthlySales = [];
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const yearMonth = date.toISOString().slice(0, 7); // "YYYY-MM"
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // "Jun 2026"

      const [[{ total }]] = await db.query(
        "SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE DATE_FORMAT(invoice_date, '%Y-%m') = ?",
        [yearMonth]
      );
      monthlySales.push(Number(total));
      months.push(monthLabel);
    }

    // 2. Opportunity Pipeline Chart (by Stage)
    const [pipelineRows] = await db.query(`
      SELECT stage, COUNT(*) as count, 
             COALESCE(SUM(expected_value), 0) as value,
             COALESCE(SUM(expected_value * probability / 100), 0) as weighted_value
      FROM opportunities
      GROUP BY stage
    `);

    // 3. Lead Source Analysis
    const [leadSourceRows] = await db.query(`
      SELECT source, COUNT(*) as count
      FROM leads
      GROUP BY source
    `);

    // 4. Product Stock Levels (for pie/doughnut charts)
    const [productStockRows] = await db.query(`
      SELECT product_name, stock_quantity
      FROM products
      WHERE status = 1
    `);

    return res.json({
      salesHistory: {
        labels: months,
        data: monthlySales
      },
      pipeline: pipelineRows,
      leadSource: leadSourceRows,
      productStock: productStockRows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getMarketPrices = async (req, res) => {
  try {
    const seed = Date.now() / 10000;
    const brentBase = 6200.00;
    const wtiBase = 5800.00;
    const dubaiBase = 6000.00;
    const gasBase = 210.00;

    const brent = Number((brentBase + Math.sin(seed) * 15 + Math.cos(seed / 2) * 5).toFixed(2));
    const wti = Number((wtiBase + Math.cos(seed) * 12 + Math.sin(seed / 3) * 4).toFixed(2));
    const dubai = Number((dubaiBase + Math.sin(seed / 1.5) * 18).toFixed(2));
    const gas = Number((gasBase + Math.cos(seed / 4) * 3).toFixed(2));

    const brentChange = Number((Math.sin(seed) * 0.25).toFixed(2));
    const wtiChange = Number((Math.cos(seed) * 0.22).toFixed(2));
    const dubaiChange = Number((Math.sin(seed / 1.5) * 0.3).toFixed(2));
    const gasChange = Number((Math.cos(seed / 4) * 1.2).toFixed(2));

    return res.json([
      { name: 'Brent Crude', code: 'BRENT', price: brent, change: brentChange, unit: 'Bbl' },
      { name: 'WTI Light Sweet', code: 'WTI', price: wti, change: wtiChange, unit: 'Bbl' },
      { name: 'Dubai Sour Crude', code: 'DUBAI', price: dubai, change: dubaiChange, unit: 'Bbl' },
      { name: 'Natural Gas', code: 'NAT-GAS', price: gas, change: gasChange, unit: 'MMBtu' }
    ]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getStats,
  getCharts,
  getMarketPrices
};
