const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getOrders = async (req, res) => {
  try {
    let query = `
      SELECT o.*, c.company_name as customer_name, opp.title as opportunity_title, u.name as approved_by_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN opportunities opp ON o.opportunity_id = opp.opportunity_id
      LEFT JOIN users u ON o.approved_by = u.user_id
      WHERE 1=1
    `;
    const params = [];

    // Tenant / Client Isolation
    if (req.user.role === 'Client') {
      query += ' AND o.customer_id = ?';
      params.push(req.user.customerId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND o.tenant_id = ?';
      params.push(req.user.tenantId);
    }

    query += ' ORDER BY o.order_date DESC';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    let query = `
      SELECT o.*, c.company_name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address, c.city as customer_city, c.state as customer_state, c.country as customer_country, opp.title as opportunity_title
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN opportunities opp ON o.opportunity_id = opp.opportunity_id
      WHERE o.order_id = ?
    `;
    const params = [id];

    if (req.user.role === 'Client') {
      query += ' AND o.customer_id = ?';
      params.push(req.user.customerId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND o.tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [orderRows] = await db.query(query, params);

    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found or access denied.' });
    }

    const [itemRows] = await db.query(`
      SELECT oi.*, p.product_name, p.product_code
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [id]);

    const orderDetail = {
      ...orderRows[0],
      items: itemRows
    };

    return res.json(orderDetail);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createOrder = async (req, res) => {
  const { customer_id, opportunity_id, order_number, order_date, status, items } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot create orders directly.' });
  }

  if (!customer_id || !order_number || !order_date || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Customer, Order Number, Order Date, and at least one Order Item are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const tenantId = req.user.role === 'SuperAdmin' ? (req.body.tenantId || 1) : req.user.tenantId;

    // Verify customer exists and belongs to same tenant
    if (req.user.role !== 'SuperAdmin') {
      const [checkCust] = await connection.query('SELECT tenant_id, city, country FROM customers WHERE customer_id = ?', [customer_id]);
      if (checkCust.length === 0 || checkCust[0].tenant_id !== tenantId) {
        throw new Error('Invalid customer selection.');
      }
    }

    // Calculate line totals and grand total
    let orderTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const { product_id, quantity, price } = item;
      if (!product_id || quantity === undefined || price === undefined) {
        throw new Error('Invalid item fields in list.');
      }
      const lineTotal = Number(quantity) * Number(price);
      orderTotal += lineTotal;
      processedItems.push({
        product_id,
        quantity,
        price,
        total: lineTotal
      });
    }

    let orderStatus = status || 'Pending Approval';
    let approvedBy = null;

    // Check Roles and Set Approvals
    if (orderStatus === 'Processing' && (req.user.role === 'CompanyAdmin' || req.user.role === 'Manager' || req.user.role === 'SuperAdmin')) {
      approvedBy = req.user.userId;
    } else {
      orderStatus = 'Pending Approval';
    }

    // Insert order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (customer_id, opportunity_id, order_number, order_date, total_amount, status, approved_by, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, opportunity_id || null, order_number, order_date, orderTotal, orderStatus, approvedBy, tenantId]
    );

    const newOrderId = orderResult.insertId;

    // Insert order items
    for (const item of processedItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, total) 
         VALUES (?, ?, ?, ?, ?)`,
        [newOrderId, item.product_id, item.quantity, item.price, item.total]
      );

      // Decrement product stock quantity
      await connection.query(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // Generate mock route coordinates based on Customer City
    const [custDetails] = await connection.query('SELECT city, country FROM customers WHERE customer_id = ?', [customer_id]);
    const customerCity = custDetails.length > 0 ? custDetails[0].city : 'Mumbai';

    let routeCoords = '[[19.076, 72.877], [21.170, 72.831], [22.307, 70.802], [23.022, 72.571], [28.613, 77.209]]'; // Mumbai to Delhi default route
    let startLat = 19.076000;
    let startLng = 72.877000;

    if (customerCity.toLowerCase() === 'singapore') {
      routeCoords = '[[1.280, 103.851], [1.300, 103.880], [1.320, 103.900], [1.340, 103.950], [1.352, 103.990]]'; // Singapore port route
      startLat = 1.280000;
      startLng = 103.851000;
    } else if (customerCity.toLowerCase() === 'mumbai') {
      routeCoords = '[[19.076, 72.877], [19.080, 72.880], [19.090, 72.900], [19.100, 72.920], [19.110, 72.950]]';
      startLat = 19.076000;
      startLng = 72.877000;
    }

    // Auto-create a logistics pending entry with coordinates
    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + 5); // 5 days delivery ETA

    await connection.query(
      `INSERT INTO logistics (order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, status, current_latitude, current_longitude, progress, route_coordinates, eta, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newOrderId, 'Atlantic Shipping Co.', 'IMO-9812736 (Tanker)', `TRK-SAAS-${Date.now().toString().slice(-6)}`, order_date, 'Pending', startLat, startLng, 0.00, routeCoords, etaDate, tenantId]
    );

    await connection.commit();

    await logActivity(req.user.userId, 'Add', 'Orders', newOrderId, tenantId);

    return res.status(201).json({
      message: orderStatus === 'Pending Approval' 
        ? 'Order successfully requested. Pending management approval.'
        : 'Order booked successfully and logistics scheduled.',
      orderId: newOrderId,
      status: orderStatus
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ message: error.message || 'Internal server error.' });
  } finally {
    connection.release();
  }
};

const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { customer_id, opportunity_id, order_number, order_date, status, items } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot edit orders.' });
  }

  if (!customer_id || !order_number || !order_date) {
    return res.status(400).json({ message: 'Customer, Order Number, and Order Date are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const tenantId = req.user.tenantId || 1;

    // Verify order exists and matches tenant
    if (req.user.role !== 'SuperAdmin') {
      const [check] = await connection.query('SELECT tenant_id FROM orders WHERE order_id = ?', [id]);
      if (check.length === 0 || check[0].tenant_id !== tenantId) {
        throw new Error('Order not found or access denied.');
      }
    }

    // Fetch existing items to restore stock before updating
    const [oldItems] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
    for (const item of oldItems) {
      await connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?', [item.quantity, item.product_id]);
    }

    let orderTotal = 0;
    let processedItems = [];

    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const { product_id, quantity, price } = item;
        const lineTotal = Number(quantity) * Number(price);
        orderTotal += lineTotal;
        processedItems.push({
          product_id,
          quantity,
          price,
          total: lineTotal
        });
      }
    } else {
      const [orderRows] = await connection.query('SELECT total_amount FROM orders WHERE order_id = ?', [id]);
      if (orderRows.length > 0) {
        orderTotal = orderRows[0].total_amount;
      }
    }

    let orderStatus = status || 'Pending Approval';
    let approvedBy = null;

    if (orderStatus === 'Processing' && (req.user.role === 'CompanyAdmin' || req.user.role === 'Manager' || req.user.role === 'SuperAdmin')) {
      approvedBy = req.user.userId;
    }

    // Update order
    const [result] = await connection.query(
      `UPDATE orders 
       SET customer_id = ?, opportunity_id = ?, order_number = ?, order_date = ?, total_amount = ?, status = ?, approved_by = ?
       WHERE order_id = ?`,
      [customer_id, opportunity_id || null, order_number, order_date, orderTotal, orderStatus, approvedBy, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Order not found.');
    }

    // If items were updated, delete old ones and insert new ones
    if (items && Array.isArray(items) && items.length > 0) {
      await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);
      for (const item of processedItems) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price, total) 
           VALUES (?, ?, ?, ?, ?)`,
          [id, item.product_id, item.quantity, item.price, item.total]
        );

        // Deduct new stock
        await connection.query(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?`,
          [item.quantity, item.product_id]
        );
      }
    } else {
      for (const item of oldItems) {
        await connection.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?', [item.quantity, item.product_id]);
      }
    }

    await connection.commit();

    await logActivity(req.user.userId, 'Update', 'Orders', id, req.user.tenantId || 1);

    return res.json({ message: 'Order updated successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ message: error.message || 'Internal server error.' });
  } finally {
    connection.release();
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot delete orders.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const tenantId = req.user.tenantId || 1;

    // Verify order exists and matches tenant
    if (req.user.role !== 'SuperAdmin') {
      const [check] = await connection.query('SELECT tenant_id FROM orders WHERE order_id = ?', [id]);
      if (check.length === 0 || check[0].tenant_id !== tenantId) {
        throw new Error('Order not found or access denied.');
      }
    }

    // Restore stock quantities
    const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?', [item.quantity, item.product_id]);
    }

    // Delete order
    const [result] = await connection.query('DELETE FROM orders WHERE order_id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Order not found.');
    }

    await connection.commit();

    await logActivity(req.user.userId, 'Delete', 'Orders', id, req.user.tenantId || 1);

    return res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ message: error.message || 'Internal server error.' });
  } finally {
    connection.release();
  }
};

const approveOrder = async (req, res) => {
  const { id } = req.params;

  if (!['SuperAdmin', 'CompanyAdmin', 'Manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden. You do not have permission to approve orders.' });
  }

  try {
    let query = 'UPDATE orders SET status = ?, approved_by = ? WHERE order_id = ?';
    const params = ['Processing', req.user.userId, id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Approval', 'Orders', id, req.user.tenantId || 1);

    return res.json({ message: 'Order approved successfully and sent to processing.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  approveOrder
};
