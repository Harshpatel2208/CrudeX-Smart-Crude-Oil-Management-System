const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getLogistics = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, o.order_number, o.order_date, c.company_name as customer_name
      FROM logistics l
      JOIN orders o ON l.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY l.dispatch_date DESC
    `);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createLogistics = async (req, res) => {
  const { order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, delivery_date, status } = req.body;

  if (!order_id || !transporter_name || !vehicle_number || !tracking_number || !dispatch_date) {
    return res.status(400).json({ message: 'Order, Transporter Name, Vehicle Number, Tracking Number, and Dispatch Date are required.' });
  }

  try {
    const logStatus = status || 'Pending';
    const [result] = await db.query(
      `INSERT INTO logistics (order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, delivery_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, delivery_date || null, logStatus]
    );

    const newLogisticsId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Logistics', newLogisticsId);

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
  const { order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, delivery_date, status } = req.body;

  if (!order_id || !transporter_name || !vehicle_number || !tracking_number || !dispatch_date) {
    return res.status(400).json({ message: 'Order, Transporter Name, Vehicle Number, Tracking Number, and Dispatch Date are required.' });
  }

  try {
    const logStatus = status || 'Pending';

    // If status is changed to Delivered and delivery_date is not provided, default to current date
    let delDate = delivery_date;
    if (logStatus === 'Delivered' && !delDate) {
      delDate = new Date().toISOString().split('T')[0];
    }

    const [result] = await db.query(
      `UPDATE logistics 
       SET order_id = ?, transporter_name = ?, vehicle_number = ?, tracking_number = ?, dispatch_date = ?, delivery_date = ?, status = ?
       WHERE logistics_id = ?`,
      [order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, delDate || null, logStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Logistics record not found.' });
    }

    // Also update order status to shipped/delivered if logistics is shipped/delivered
    let orderStatus = null;
    if (logStatus === 'In Transit') orderStatus = 'Shipped';
    if (logStatus === 'Delivered') orderStatus = 'Delivered';

    if (orderStatus) {
      await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [orderStatus, order_id]);
    }

    await logActivity(req.user.userId, 'Update', 'Logistics', id);

    return res.json({ message: 'Logistics record updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteLogistics = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM logistics WHERE logistics_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Logistics record not found.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Logistics', id);

    return res.json({ message: 'Logistics record deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getLogistics,
  createLogistics,
  updateLogistics,
  deleteLogistics
};
