const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getContracts = async (req, res) => {
  const { status } = req.query;

  try {
    let query = `
      SELECT con.*, cust.company_name as customer_name
      FROM contracts con
      JOIN customers cust ON con.customer_id = cust.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND con.status = ?';
      params.push(status);
    }

    query += ' ORDER BY con.created_at DESC';

    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const createContract = async (req, res) => {
  const { customer_id, contract_number, contract_value, start_date, end_date, status } = req.body;

  if (!customer_id || !contract_number || contract_value === undefined || !start_date || !end_date) {
    return res.status(400).json({ message: 'Customer, Contract Number, Contract Value, Start Date, and End Date are required.' });
  }

  try {
    const contrStatus = status || 'Draft';
    const [result] = await db.query(
      `INSERT INTO contracts (customer_id, contract_number, contract_value, start_date, end_date, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_id, contract_number, contract_value, start_date, end_date, contrStatus]
    );

    const newContractId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Contracts', newContractId);

    return res.status(201).json({
      message: 'Contract created successfully.',
      contractId: newContractId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateContract = async (req, res) => {
  const { id } = req.params;
  const { customer_id, contract_number, contract_value, start_date, end_date, status } = req.body;

  if (!customer_id || !contract_number || contract_value === undefined || !start_date || !end_date) {
    return res.status(400).json({ message: 'Customer, Contract Number, Contract Value, Start Date, and End Date are required.' });
  }

  try {
    const contrStatus = status || 'Draft';
    const [result] = await db.query(
      `UPDATE contracts 
       SET customer_id = ?, contract_number = ?, contract_value = ?, start_date = ?, end_date = ?, status = ?
       WHERE contract_id = ?`,
      [customer_id, contract_number, contract_value, start_date, end_date, contrStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contract not found.' });
    }

    await logActivity(req.user.userId, 'Update', 'Contracts', id);

    return res.json({ message: 'Contract updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteContract = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM contracts WHERE contract_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contract not found.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Contracts', id);

    return res.json({ message: 'Contract deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getContracts,
  createContract,
  updateContract,
  deleteContract
};
