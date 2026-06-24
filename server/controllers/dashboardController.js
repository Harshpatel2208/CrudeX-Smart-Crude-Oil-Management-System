const db = require('../config/db');

const getStats = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'SuperAdmin';
    const isClient = req.user.role === 'Client';
    const tenantId = req.user.tenantId;
    const customerId = req.user.customerId;

    let custWhere = 'WHERE 1=1';
    let leadWhere = 'WHERE 1=1';
    let oppWhere = 'WHERE 1=1';
    let ordWhere = 'WHERE 1=1';
    let payWhere = 'WHERE 1=1';
    let logWhere = 'WHERE 1=1';
    let contrWhere = 'WHERE 1=1';

    const params = [];

    if (isClient) {
      custWhere = 'WHERE customer_id = ?';
      leadWhere = 'WHERE customer_id = ?';
      oppWhere = 'WHERE customer_id = ?';
      ordWhere = 'WHERE customer_id = ?';
      payWhere = 'WHERE invoice_id IN (SELECT invoice_id FROM invoices WHERE customer_id = ?)';
      logWhere = 'WHERE order_id IN (SELECT order_id FROM orders WHERE customer_id = ?)';
      contrWhere = 'WHERE customer_id = ?';
      params.push(customerId);
    } else if (!isSuperAdmin) {
      custWhere = 'WHERE tenant_id = ?';
      leadWhere = 'WHERE tenant_id = ?';
      oppWhere = 'WHERE tenant_id = ?';
      ordWhere = 'WHERE tenant_id = ?';
      payWhere = 'WHERE tenant_id = ?';
      logWhere = 'WHERE tenant_id = ?';
      contrWhere = 'WHERE tenant_id = ?';
      params.push(tenantId);
    }

    // 1. Total Customers
    let custQuery = 'SELECT COUNT(*) as count FROM customers ' + custWhere;
    const [[{ count: totalCustomers }]] = await db.query(custQuery, params);

    // 2. Total Leads
    let leadQuery = 'SELECT COUNT(*) as count FROM leads ' + leadWhere;
    const [[{ count: totalLeads }]] = await db.query(leadQuery, params);

    // 3. Total Opportunities
    let oppQuery = 'SELECT COUNT(*) as count FROM opportunities ' + oppWhere;
    const [[{ count: totalOpportunities }]] = await db.query(oppQuery, params);

    // 4. Total Orders
    let ordQuery = 'SELECT COUNT(*) as count FROM orders ' + ordWhere;
    const [[{ count: totalOrders }]] = await db.query(ordQuery, params);

    // 5. Total Revenue (sum of payments)
    let payQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM payments ' + payWhere;
    const [[{ total: totalRevenue }]] = await db.query(payQuery, params);

    // 6. Pending Deliveries
    let pendingQuery = `SELECT COUNT(*) as count FROM logistics ${logWhere} ${isSuperAdmin || isClient ? 'AND' : 'AND'} status IN ('Pending', 'In Transit')`;
    // Clean up query structure
    const logBase = logWhere.replace('WHERE', '');
    let finalLogWhere = logBase ? `WHERE ${logBase} AND status IN ('Pending', 'In Transit')` : "WHERE status IN ('Pending', 'In Transit')";
    const [[{ count: pendingDeliveries }]] = await db.query(`SELECT COUNT(*) as count FROM logistics ${finalLogWhere}`, params);

    // 7. Active Contracts
    const contrBase = contrWhere.replace('WHERE', '');
    let finalContrWhere = contrBase ? `WHERE ${contrBase} AND status = 'Active'` : "WHERE status = 'Active'";
    const [[{ count: activeContracts }]] = await db.query(`SELECT COUNT(*) as count FROM contracts ${finalContrWhere}`, params);

    // 8. Total Weighted Pipeline
    const oppBase = oppWhere.replace('WHERE', '');
    let finalOppWhere = oppBase 
      ? `WHERE ${oppBase} AND stage NOT IN ('Closed Won', 'Closed Lost')` 
      : "WHERE stage NOT IN ('Closed Won', 'Closed Lost')";
    const [[{ total: totalWeightedPipeline }]] = await db.query(
      `SELECT COALESCE(SUM(expected_value * probability / 100), 0) as total FROM opportunities ${finalOppWhere}`, 
      params
    );

    // 9. Recent Contracts
    let recentContrQuery = `
      SELECT con.*, cust.company_name as customer_name
      FROM contracts con
      JOIN customers cust ON con.customer_id = cust.customer_id
      ${contrWhere.replace('WHERE', 'AND').replace('tenant_id =', 'con.tenant_id =').replace('customer_id =', 'con.customer_id =')}
      ORDER BY con.created_at DESC
      LIMIT 5
    `;
    // Adjust if first WHERE is replaced by JOIN AND
    recentContrQuery = recentContrQuery.replace('con.customer_id = cust.customer_id AND', 'con.customer_id = cust.customer_id WHERE');
    if (isSuperAdmin) {
      recentContrQuery = recentContrQuery.replace('WHERE 1=1', '');
    }
    const [recentContracts] = await db.query(recentContrQuery, params);

    // 10. Recent Logistics
    let recentLogQuery = `
      SELECT l.*, o.order_number, c.company_name as customer_name
      FROM logistics l
      JOIN orders o ON l.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      ${logWhere.replace('order_id IN', 'l.order_id IN').replace('tenant_id =', 'l.tenant_id =')}
      ORDER BY l.created_at DESC
      LIMIT 5
    `;
    if (isSuperAdmin) {
      recentLogQuery = recentLogQuery.replace('WHERE 1=1', '');
    }
    const [recentLogistics] = await db.query(recentLogQuery, params);

    // 11. SaaS Super Admin stats if role is SuperAdmin
    let superAdminStats = null;
    if (isSuperAdmin) {
      const [[{ tenantCount }]] = await db.query('SELECT COUNT(*) as count FROM tenants');
      const [tenantsList] = await db.query('SELECT * FROM tenants ORDER BY created_at DESC LIMIT 5');
      superAdminStats = {
        tenantCount,
        tenantsList
      };
    }

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
      recentLogistics,
      superAdminStats
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getCharts = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'SuperAdmin';
    const isClient = req.user.role === 'Client';
    const tenantId = req.user.tenantId;
    const customerId = req.user.customerId;

    const params = [];
    let tenantFilter = '';
    if (isClient) {
      tenantFilter = ' AND customer_id = ? ';
      params.push(customerId);
    } else if (!isSuperAdmin) {
      tenantFilter = ' AND tenant_id = ? ';
      params.push(tenantId);
    }

    // 1. Monthly Sales (last 6 months)
    const monthlySales = [];
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const yearMonth = date.toISOString().slice(0, 7);
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      // Build specific params for dynamic month query
      const monthParams = [yearMonth, ...params];
      const [[{ total }]] = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE DATE_FORMAT(invoice_date, '%Y-%m') = ? ${tenantFilter}`,
        monthParams
      );
      monthlySales.push(Number(total));
      months.push(monthLabel);
    }

    // 2. Opportunity Pipeline Chart
    const [pipelineRows] = await db.query(
      `SELECT stage, COUNT(*) as count, 
              COALESCE(SUM(expected_value), 0) as value,
              COALESCE(SUM(expected_value * probability / 100), 0) as weighted_value
       FROM opportunities
       WHERE 1=1 ${tenantFilter}
       GROUP BY stage`,
      params
    );

    // 3. Lead Source Analysis
    const [leadSourceRows] = await db.query(
      `SELECT source, COUNT(*) as count
       FROM leads
       WHERE 1=1 ${tenantFilter}
       GROUP BY source`,
      params
    );

    // 4. Product Stock Levels
    const [productStockRows] = await db.query(
      `SELECT product_name, stock_quantity
       FROM products
       WHERE status = 1 ${isSuperAdmin ? '' : 'AND tenant_id = ?'}`,
      isSuperAdmin ? [] : [tenantId]
    );

    // 5. Dynamic Depletion Forecast (Premium Feature)
    // Average daily consumption of each product in past 30 days
    let depletionForecast = [];
    if (!isClient) {
      const productQuery = `SELECT product_id, product_name, stock_quantity FROM products WHERE status = 1 ${isSuperAdmin ? '' : 'AND tenant_id = ?'}`;
      const [products] = await db.query(productQuery, isSuperAdmin ? [] : [tenantId]);

      for (const prod of products) {
        const [[{ totalDispatched }]] = await db.query(`
          SELECT COALESCE(SUM(oi.quantity), 0) as total
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.order_id
          WHERE oi.product_id = ? AND o.status IN ('Processing', 'Shipped', 'Delivered')
          AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `, [prod.product_id]);

        const avgDaily = Number(totalDispatched) / 30.00;
        let daysLeft = 'No consumption';

        if (avgDaily > 0) {
          daysLeft = Math.round(Number(prod.stock_quantity) / avgDaily);
        }

        depletionForecast.push({
          productId: prod.product_id,
          productName: prod.product_name,
          stock: prod.stock_quantity,
          avgDaily: avgDaily.toFixed(2),
          daysRemaining: daysLeft
        });
      }
    }

    // 6. Credit Risk Aging Matrix (Premium Feature)
    let creditRisk = [];
    if (!isClient) {
      const [riskRows] = await db.query(`
        SELECT 
          c.company_name,
          COALESCE(SUM(inv.total_amount), 0) as outstanding,
          DATEDIFF(CURDATE(), MIN(inv.invoice_date)) as oldest_invoice_days
        FROM customers c
        JOIN invoices inv ON c.customer_id = inv.customer_id
        WHERE inv.payment_status != 'Paid'
        ${isSuperAdmin ? '' : 'AND c.tenant_id = ?'}
        GROUP BY c.customer_id
      `, isSuperAdmin ? [] : [tenantId]);

      creditRisk = riskRows.map(r => {
        let riskScore = 'Low';
        if (Number(r.outstanding) > 1000000 || Number(r.oldest_invoice_days) > 60) {
          riskScore = 'High';
        } else if (Number(r.outstanding) > 200000 || Number(r.oldest_invoice_days) > 30) {
          riskScore = 'Medium';
        }
        return {
          companyName: r.company_name,
          outstanding: r.outstanding,
          oldestInvoiceDays: r.oldest_invoice_days || 0,
          risk: riskScore
        };
      });
    }

    return res.json({
      salesHistory: {
        labels: months,
        data: monthlySales
      },
      pipeline: pipelineRows,
      leadSource: leadSourceRows,
      productStock: productStockRows,
      depletionForecast,
      creditRisk
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getMarketPrices = async (req, res) => {
  try {
    // Read directly from oil_benchmarks table
    const [rows] = await db.query('SELECT * FROM oil_benchmarks ORDER BY benchmark_id ASC');
    
    // Add code and unit mapping
    const codes = { 1: 'BRENT', 2: 'WTI', 3: 'DUBAI' };
    const names = { 1: 'Brent Crude', 2: 'WTI Light Sweet', 3: 'Dubai Sour Crude' };
    
    const mapped = rows.map(r => {
      // Simulate small fluctuation decimal change to represent live market movements
      const change = Number((Math.sin(Date.now() / 20000 + r.benchmark_id) * 0.25).toFixed(2));
      return {
        benchmarkId: r.benchmark_id,
        name: names[r.benchmark_id] || r.name,
        code: codes[r.benchmark_id] || 'OIL',
        price: Number(r.current_price),
        change,
        unit: 'Bbl'
      };
    });

    return res.json(mapped);
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
