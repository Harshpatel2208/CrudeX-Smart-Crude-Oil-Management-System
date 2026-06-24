const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getProducts = async (req, res) => {
  try {
    let query = `
      SELECT p.*, ob.name AS benchmark_name, ob.current_price AS benchmark_price
      FROM products p
      LEFT JOIN oil_benchmarks ob ON p.linked_benchmark_id = ob.benchmark_id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND p.tenant_id = ?';
      params.push(req.user.tenantId);
    }

    query += ' ORDER BY p.product_name ASC';

    const [rows] = await db.query(query, params);

    // Calculate dynamic price based on benchmark + margin if linked
    const productsWithPrices = rows.map(prod => {
      let finalPrice = Number(prod.unit_price);
      if (prod.linked_benchmark_id && prod.benchmark_price !== null) {
        finalPrice = Number(prod.benchmark_price) + Number(prod.margin_offset);
      }
      return {
        ...prod,
        effective_price: finalPrice,
        low_stock: Number(prod.stock_quantity) < 5000
      };
    });

    return res.json(productsWithPrices);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createProduct = async (req, res) => {
  const { product_name, product_code, category, unit_price, stock_quantity, description, status, linked_benchmark_id, margin_offset } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot create products.' });
  }

  if (!product_name || !product_code || !category || unit_price === undefined || stock_quantity === undefined) {
    return res.status(400).json({ message: 'Product Name, Product Code, Category, Unit Price, and Stock Quantity are required.' });
  }

  try {
    const prodStatus = status !== undefined ? status : 1;
    const tenantId = req.user.role === 'SuperAdmin' ? (req.body.tenantId || 1) : req.user.tenantId;

    const [result] = await db.query(
      `INSERT INTO products (product_name, product_code, category, unit_price, linked_benchmark_id, margin_offset, stock_quantity, description, status, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_name, product_code, category, unit_price, linked_benchmark_id || null, margin_offset || 0.00, stock_quantity, description || null, prodStatus, tenantId]
    );

    const newProdId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Products', newProdId, tenantId);

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
  const { product_name, product_code, category, unit_price, stock_quantity, description, status, linked_benchmark_id, margin_offset } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot modify products.' });
  }

  if (!product_name || !product_code || !category || unit_price === undefined || stock_quantity === undefined) {
    return res.status(400).json({ message: 'Product Name, Product Code, Category, Unit Price, and Stock Quantity are required.' });
  }

  try {
    let query = `
      UPDATE products 
      SET product_name = ?, product_code = ?, category = ?, unit_price = ?, linked_benchmark_id = ?, margin_offset = ?, stock_quantity = ?, description = ?, status = ?
      WHERE product_id = ?
    `;
    const params = [product_name, product_code, category, unit_price, linked_benchmark_id || null, margin_offset || 0.00, stock_quantity, description || null, status !== undefined ? status : 1, id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Update', 'Products', id, req.user.tenantId || 1);

    return res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot delete products.' });
  }

  try {
    let query = 'DELETE FROM products WHERE product_id = ?';
    const params = [id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Products', id, req.user.tenantId || 1);

    return res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET live benchmarks
const getBenchmarks = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM oil_benchmarks ORDER BY benchmark_id ASC');
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Fluctuate oil benchmarks (Simulate market shifts)
const fluctuateBenchmarks = async (req, res) => {
  try {
    const [benchmarks] = await db.query('SELECT * FROM oil_benchmarks');
    for (const bench of benchmarks) {
      // Random change between -2% and +2%
      const percentageChange = (Math.random() * 4 - 2) / 100;
      const newPrice = Number(bench.current_price) * (1 + percentageChange);
      await db.query(
        'UPDATE oil_benchmarks SET current_price = ? WHERE benchmark_id = ?',
        [newPrice.toFixed(2), bench.benchmark_id]
      );
    }
    const [updated] = await db.query('SELECT * FROM oil_benchmarks ORDER BY benchmark_id ASC');
    return res.json({ message: 'Market prices fluctuated successfully.', benchmarks: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getBenchmarks,
  fluctuateBenchmarks
};
