const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, c.company_name as customer_name, opp.title as opportunity_title
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN opportunities opp ON o.opportunity_id = opp.opportunity_id
      ORDER BY o.order_date DESC
    `);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const [orderRows] = await db.query(`
      SELECT o.*, c.company_name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address, c.city as customer_city, c.state as customer_state, c.country as customer_country, opp.title as opportunity_title
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN opportunities opp ON o.opportunity_id = opp.opportunity_id
      WHERE o.order_id = ?
    `, [id]);

    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
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

  if (!customer_id || !order_number || !order_date || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Customer, Order Number, Order Date, and at least one Order Item are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

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

    const orderStatus = status || 'Pending';

    // Insert order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (customer_id, opportunity_id, order_number, order_date, total_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_id, opportunity_id || null, order_number, order_date, orderTotal, orderStatus]
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

    // Auto-create a logistics pending entry for the order
    await connection.query(
      `INSERT INTO logistics (order_id, transporter_name, vehicle_number, tracking_number, dispatch_date, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newOrderId, 'TBD', 'TBD', `TRK-AUTO-${Date.now()}`, order_date, 'Pending']
    );

    await connection.commit();

    await logActivity(req.user.userId, 'Add', 'Orders', newOrderId);

    return res.status(201).json({
      message: 'Order created successfully.',
      orderId: newOrderId
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

  if (!customer_id || !order_number || !order_date) {
    return res.status(400).json({ message: 'Customer, Order Number, and Order Date are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

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
      // Re-read existing total if items not provided/changed
      const [orderRows] = await connection.query('SELECT total_amount FROM orders WHERE order_id = ?', [id]);
      if (orderRows.length > 0) {
        orderTotal = orderRows[0].total_amount;
      }
    }

    // Update order
    const [result] = await connection.query(
      `UPDATE orders 
       SET customer_id = ?, opportunity_id = ?, order_number = ?, order_date = ?, total_amount = ?, status = ?
       WHERE order_id = ?`,
      [customer_id, opportunity_id || null, order_number, order_date, orderTotal, status, id]
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
      // If items weren't updated, re-apply old stock deductions
      for (const item of oldItems) {
        await connection.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?', [item.quantity, item.product_id]);
      }
    }

    await connection.commit();

    await logActivity(req.user.userId, 'Update', 'Orders', id);

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

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Restore stock quantities
    const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?', [item.quantity, item.product_id]);
    }

    // Delete order (cascades delete on order_items, logistics, invoices, payments)
    const [result] = await connection.query('DELETE FROM orders WHERE order_id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Order not found.');
    }

    await connection.commit();

    await logActivity(req.user.userId, 'Delete', 'Orders', id);

    return res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ message: error.message || 'Internal server error.' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
};
