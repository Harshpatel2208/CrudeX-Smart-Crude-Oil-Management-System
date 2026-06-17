const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY product_name ASC');
    // Calculate low stock alert (e.g. stock_quantity < 5000 units)
    const productsWithAlerts = rows.map(prod => ({
      ...prod,
      low_stock: Number(prod.stock_quantity) < 5000
    }));
    return res.json(productsWithAlerts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createProduct = async (req, res) => {
  const { product_name, product_code, category, unit_price, stock_quantity, description, status } = req.body;

  if (!product_name || !product_code || !category || unit_price === undefined || stock_quantity === undefined) {
    return res.status(400).json({ message: 'Product Name, Product Code, Category, Unit Price, and Stock Quantity are required.' });
  }

  try {
    const prodStatus = status !== undefined ? status : 1;
    const [result] = await db.query(
      `INSERT INTO products (product_name, product_code, category, unit_price, stock_quantity, description, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product_name, product_code, category, unit_price, stock_quantity, description || null, prodStatus]
    );

    const newProdId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Products', newProdId);

    return res.status(201).json({
      message: 'Product created successfully.',
      productId: newProdId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { product_name, product_code, category, unit_price, stock_quantity, description, status } = req.body;

  if (!product_name || !product_code || !category || unit_price === undefined || stock_quantity === undefined) {
    return res.status(400).json({ message: 'Product Name, Product Code, Category, Unit Price, and Stock Quantity are required.' });
  }

  try {
    const prodStatus = status !== undefined ? status : 1;
    const [result] = await db.query(
      `UPDATE products 
       SET product_name = ?, product_code = ?, category = ?, unit_price = ?, stock_quantity = ?, description = ?, status = ?
       WHERE product_id = ?`,
      [product_name, product_code, category, unit_price, stock_quantity, description || null, prodStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await logActivity(req.user.userId, 'Update', 'Products', id);

    return res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM products WHERE product_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Products', id);

    return res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
