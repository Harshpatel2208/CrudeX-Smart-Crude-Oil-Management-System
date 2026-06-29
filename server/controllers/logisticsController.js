const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getLogistics = async (req, res) => {
  try {
    let query = `
      SELECT l.*, o.order_number, o.order_date, o.customer_id, c.company_name as customer_name
      FROM logistics l
      JOIN orders o ON l.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];

    // Tenant / Client Isolation
    if (req.user.role === 'Client') {
      query += ' AND o.customer_id = ?';
      params.push(req.user.customerId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND l.tenant_id = ?';
      params.push(req.user.tenantId);
    }

    query += ' ORDER BY l.dispatch_date DESC';

    const [rows] = await db.query(query, params);

    // Parse route coordinates safely and cast DECIMAL fields to numbers
    const parsedRows = rows.map(r => {
      let coords = [];
      try {
        coords = r.route_coordinates ? JSON.parse(r.route_coordinates) : [];
      } catch (err) {
        coords = [];
      }
      return {
        ...r,
        current_latitude: Number(r.current_latitude) || 0,
        current_longitude: Number(r.current_longitude) || 0,
        progress: Number(r.progress) || 0,
        route_coordinates: coords
      };
    });

    return res.json(parsedRows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createLogistics = async (req, res) => {
  const { order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, delivery_date, status, current_latitude, current_longitude, progress, route_coordinates, eta } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot create logistics dispatches.' });
  }

  if (!order_id || !transporter_name || !vehicle_number || !tracking_number || !dispatch_date) {
    return res.status(400).json({ message: 'Order, Transporter Name, Vehicle Number, Tracking Number, and Dispatch Date are required.' });
  }

  try {
    const tenantId = req.user.role === 'SuperAdmin' ? (req.body.tenantId || 1) : req.user.tenantId;

    // Verify order exists and belongs to same tenant
    if (req.user.role !== 'SuperAdmin') {
      const [checkOrder] = await db.query('SELECT tenant_id FROM orders WHERE order_id = ?', [order_id]);
      if (checkOrder.length === 0 || checkOrder[0].tenant_id !== tenantId) {
        return res.status(400).json({ message: 'Invalid order selection.' });
      }
    }

    const logStatus = status || 'Pending';
    let parsedCoords = route_coordinates ? (typeof route_coordinates === 'string' ? route_coordinates : JSON.stringify(route_coordinates)) : null;

    if (!parsedCoords) {
      // Auto-generate route based on customer city
      const [orderRows] = await db.query(
        'SELECT c.city FROM orders o JOIN customers c ON o.customer_id = c.customer_id WHERE o.order_id = ?',
        [order_id]
      );
      const customerCity = orderRows.length > 0 ? orderRows[0].city : 'Mumbai';
      let routeCoords = '[[19.076, 72.877], [21.170, 72.831], [22.307, 70.802], [23.022, 72.571], [28.613, 77.209]]';
      if (customerCity && customerCity.toLowerCase() === 'singapore') {
        routeCoords = '[[1.280, 103.851], [1.300, 103.880], [1.320, 103.900], [1.340, 103.950], [1.352, 103.990]]';
      } else if (customerCity && customerCity.toLowerCase() === 'mumbai') {
        routeCoords = '[[19.076, 72.877], [19.080, 72.880], [19.090, 72.900], [19.100, 72.920], [19.110, 72.950]]';
      }
      parsedCoords = routeCoords;
    }

    const [result] = await db.query(
      `INSERT INTO logistics (order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, delivery_date, status, current_latitude, current_longitude, progress, route_coordinates, eta, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id, 
        transporter_name, 
        vehicle_number, 
        tracking_number, 
        dispatch_date, 
        delivery_date || null, 
        logStatus, 
        current_latitude || 0.0, 
        current_longitude || 0.0, 
        progress || 0.00, 
        parsedCoords, 
        eta || null, 
        tenantId
      ]
    );

    const newLogisticsId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Logistics', newLogisticsId, tenantId);

    return res.status(201).json({
      message: 'Logistics record created successfully.',
      logisticsId: newLogisticsId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateLogistics = async (req, res) => {
  const { id } = req.params;
  const { order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, delivery_date, status, current_latitude, current_longitude, progress, route_coordinates, eta } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot modify logistics.' });
  }

  if (!order_id || !transporter_name || !vehicle_number || !tracking_number || !dispatch_date) {
    return res.status(400).json({ message: 'Order, Transporter Name, Vehicle Number, Tracking Number, and Dispatch Date are required.' });
  }

  try {
    const tenantId = req.user.tenantId || 1;

    // Verify logistics matches tenant
    if (req.user.role !== 'SuperAdmin') {
      const [check] = await db.query('SELECT tenant_id FROM logistics WHERE logistics_id = ?', [id]);
      if (check.length === 0 || check[0].tenant_id !== tenantId) {
        return res.status(404).json({ message: 'Logistics record not found or access denied.' });
      }
    }

    const logStatus = status || 'Pending';
    let delDate = delivery_date;
    if (logStatus === 'Delivered' && !delDate) {
      delDate = new Date().toISOString().split('T')[0];
    }

    let parsedCoords = route_coordinates ? (typeof route_coordinates === 'string' ? route_coordinates : JSON.stringify(route_coordinates)) : null;

    if (!parsedCoords) {
      // Auto-generate route based on customer city
      const [orderRows] = await db.query(
        'SELECT c.city FROM orders o JOIN customers c ON o.customer_id = c.customer_id WHERE o.order_id = ?',
        [order_id]
      );
      const customerCity = orderRows.length > 0 ? orderRows[0].city : 'Mumbai';
      let routeCoords = '[[19.076, 72.877], [21.170, 72.831], [22.307, 70.802], [23.022, 72.571], [28.613, 77.209]]';
      if (customerCity && customerCity.toLowerCase() === 'singapore') {
        routeCoords = '[[1.280, 103.851], [1.300, 103.880], [1.320, 103.900], [1.340, 103.950], [1.352, 103.990]]';
      } else if (customerCity && customerCity.toLowerCase() === 'mumbai') {
        routeCoords = '[[19.076, 72.877], [19.080, 72.880], [19.090, 72.900], [19.100, 72.920], [19.110, 72.950]]';
      }
      parsedCoords = routeCoords;
    }

    const [result] = await db.query(
      `UPDATE logistics 
       SET order_id = ?, transporter_name = ?, vehicle_number = ?, tracking_number = ?, dispatch_date = ?, delivery_date = ?, status = ?, current_latitude = ?, current_longitude = ?, progress = ?, route_coordinates = ?, eta = ?
       WHERE logistics_id = ?`,
      [
        order_id, 
        transporter_name, 
        vehicle_number, 
        tracking_number, 
        dispatch_date, 
        delDate || null, 
        logStatus, 
        current_latitude || 0.0, 
        current_longitude || 0.0, 
        progress || 0.00, 
        parsedCoords, 
        eta || null, 
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Logistics record not found.' });
    }

    // Sync order status
    let orderStatus = null;
    if (logStatus === 'In Transit') orderStatus = 'Shipped';
    if (logStatus === 'Delivered') orderStatus = 'Delivered';

    if (orderStatus) {
      await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [orderStatus, order_id]);
    }

    await logActivity(req.user.userId, 'Update', 'Logistics', id, req.user.tenantId || 1);

    return res.json({ message: 'Logistics record updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteLogistics = async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot delete logistics.' });
  }

  try {
    let query = 'DELETE FROM logistics WHERE logistics_id = ?';
    const params = [id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Logistics record not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Logistics', id, req.user.tenantId || 1);

    return res.json({ message: 'Logistics record deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// SIMULATE A MOVEMENT STEP ON THE GEOSPATIAL MAP
const stepLogistics = async (req, res) => {
  const { id } = req.params;

  try {
    let selectQuery = 'SELECT * FROM logistics WHERE logistics_id = ?';
    const selectParams = [id];

    if (req.user.role !== 'SuperAdmin') {
      selectQuery += ' AND tenant_id = ?';
      selectParams.push(req.user.tenantId);
    }

    const [rows] = await db.query(selectQuery, selectParams);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Logistics record not found or access denied.' });
    }

    const logRecord = rows[0];
    if (logRecord.status === 'Delivered') {
      return res.json({ message: 'Shipment is already delivered.', logistics: logRecord });
    }

    let route = [];
    try {
      route = logRecord.route_coordinates ? JSON.parse(logRecord.route_coordinates) : [];
    } catch (err) {
      route = [];
    }

    if (route.length === 0) {
      // Generate mock route coordinates on the fly based on customer's city
      const [orderRows] = await db.query(
        'SELECT c.city FROM orders o JOIN customers c ON o.customer_id = c.customer_id WHERE o.order_id = ?',
        [logRecord.order_id]
      );
      const customerCity = orderRows.length > 0 ? orderRows[0].city : 'Mumbai';
      let routeCoords = '[[19.076, 72.877], [21.170, 72.831], [22.307, 70.802], [23.022, 72.571], [28.613, 77.209]]';
      if (customerCity && customerCity.toLowerCase() === 'singapore') {
        routeCoords = '[[1.280, 103.851], [1.300, 103.880], [1.320, 103.900], [1.340, 103.950], [1.352, 103.990]]';
      } else if (customerCity && customerCity.toLowerCase() === 'mumbai') {
        routeCoords = '[[19.076, 72.877], [19.080, 72.880], [19.090, 72.900], [19.100, 72.920], [19.110, 72.950]]';
      }
      route = JSON.parse(routeCoords);
      // Persist the generated coordinates so they don't have to be generated again
      await db.query('UPDATE logistics SET route_coordinates = ? WHERE logistics_id = ?', [routeCoords, id]);
    }

    // Increment progress by 25%
    let newProgress = Number(logRecord.progress) + 25.00;
    if (newProgress > 100) newProgress = 100;

    // Calculate coordinate index
    const index = Math.min(route.length - 1, Math.floor((newProgress / 100) * (route.length - 1)));
    const [nextLat, nextLng] = route[index];

    let nextStatus = 'In Transit';
    let delDate = logRecord.delivery_date;

    if (newProgress >= 100) {
      nextStatus = 'Delivered';
      delDate = new Date().toISOString().split('T')[0];
    }

    await db.query(
      `UPDATE logistics 
       SET progress = ?, current_latitude = ?, current_longitude = ?, status = ?, delivery_date = ?
       WHERE logistics_id = ?`,
      [newProgress, nextLat, nextLng, nextStatus, delDate, id]
    );

    // Sync order status
    let orderStatus = nextStatus === 'Delivered' ? 'Delivered' : 'Shipped';
    await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [orderStatus, logRecord.order_id]);

    await logActivity(req.user.userId, 'Update', 'Logistics', id, req.user.tenantId || 1);

    return res.json({
      message: `Shipment advanced to ${newProgress}%.`,
      current_latitude: nextLat,
      current_longitude: nextLng,
      progress: newProgress,
      status: nextStatus
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getLogistics,
  createLogistics,
  updateLogistics,
  deleteLogistics,
  stepLogistics
};
