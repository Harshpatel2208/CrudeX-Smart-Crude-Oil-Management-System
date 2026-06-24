const db = require('../config/db');
const { logActivity } = require('../middleware/logMiddleware');

const getContracts = async (req, res) => {
  const { status } = req.query;

  try {
    let query = `
      SELECT con.*, cust.company_name as customer_name, u.name as approved_by_name
      FROM contracts con
      JOIN customers cust ON con.customer_id = cust.customer_id
      LEFT JOIN users u ON con.approved_by = u.user_id
      WHERE 1=1
    `;
    const params = [];

    // Tenant / Client Isolation
    if (req.user.role === 'Client') {
      query += ' AND con.customer_id = ?';
      params.push(req.user.customerId);
    } else if (req.user.role !== 'SuperAdmin') {
      query += ' AND con.tenant_id = ?';
      params.push(req.user.tenantId);
    }

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

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot create contracts.' });
  }

  if (!customer_id || !contract_number || contract_value === undefined || !start_date || !end_date) {
    return res.status(400).json({ message: 'Customer, Contract Number, Contract Value, Start Date, and End Date are required.' });
  }

  try {
    const tenantId = req.user.role === 'SuperAdmin' ? (req.body.tenantId || 1) : req.user.tenantId;
    let contrStatus = status || 'Draft';
    let approvedBy = null;

    // Apply Threshold Gatekeeping Rule:
    // If contract value > 100,000 and created by Employee/Client, it MUST be approved.
    if (Number(contract_value) > 100000 && (req.user.role === 'Employee' || req.user.role === 'Client')) {
      if (contrStatus === 'Active') {
        contrStatus = 'Pending Approval';
      }
    }

    // Auto-approve if created directly by Admin or Manager
    if (contrStatus === 'Active' && (req.user.role === 'CompanyAdmin' || req.user.role === 'Manager' || req.user.role === 'SuperAdmin')) {
      approvedBy = req.user.userId;
    }

    const [result] = await db.query(
      `INSERT INTO contracts (customer_id, contract_number, contract_value, start_date, end_date, status, approved_by, tenant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, contract_number, contract_value, start_date, end_date, contrStatus, approvedBy, tenantId]
    );

    const newContractId = result.insertId;

    await logActivity(req.user.userId, 'Add', 'Contracts', newContractId, tenantId);

    return res.status(201).json({
      message: contrStatus === 'Pending Approval' 
        ? 'Contract draft saved. Requires manager approval due to value threshold (> $100,000).'
        : 'Contract created successfully.',
      contractId: newContractId,
      status: contrStatus
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateContract = async (req, res) => {
  const { id } = req.params;
  const { customer_id, contract_number, contract_value, start_date, end_date, status } = req.body;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot modify contracts.' });
  }

  if (!customer_id || !contract_number || contract_value === undefined || !start_date || !end_date) {
    return res.status(400).json({ message: 'Customer, Contract Number, Contract Value, Start Date, and End Date are required.' });
  }

  try {
    let contrStatus = status || 'Draft';
    let approvedBy = null;

    // Apply Threshold Gatekeeping Rule:
    if (Number(contract_value) > 100000 && (req.user.role === 'Employee' || req.user.role === 'Client')) {
      if (contrStatus === 'Active') {
        contrStatus = 'Pending Approval';
      }
    }

    if (contrStatus === 'Active' && (req.user.role === 'CompanyAdmin' || req.user.role === 'Manager' || req.user.role === 'SuperAdmin')) {
      approvedBy = req.user.userId;
    }

    let query = `
      UPDATE contracts 
      SET customer_id = ?, contract_number = ?, contract_value = ?, start_date = ?, end_date = ?, status = ?, approved_by = ?
      WHERE contract_id = ?
    `;
    const params = [customer_id, contract_number, contract_value, start_date, end_date, contrStatus, approvedBy, id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contract not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Update', 'Contracts', id, req.user.tenantId || 1);

    return res.json({ 
      message: contrStatus === 'Pending Approval'
        ? 'Contract updated and submitted for manager approval.'
        : 'Contract updated successfully.',
      status: contrStatus
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteContract = async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'Client') {
    return res.status(403).json({ message: 'Clients cannot delete contracts.' });
  }

  try {
    let query = 'DELETE FROM contracts WHERE contract_id = ?';
    const params = [id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contract not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Delete', 'Contracts', id, req.user.tenantId || 1);

    return res.json({ message: 'Contract deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const approveContract = async (req, res) => {
  const { id } = req.params;

  // Only Admin or Manager can approve
  if (!['SuperAdmin', 'CompanyAdmin', 'Manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden. You do not have permission to approve contracts.' });
  }

  try {
    let query = 'UPDATE contracts SET status = ?, approved_by = ? WHERE contract_id = ?';
    const params = ['Active', req.user.userId, id];

    if (req.user.role !== 'SuperAdmin') {
      query += ' AND tenant_id = ?';
      params.push(req.user.tenantId);
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contract not found or access denied.' });
    }

    await logActivity(req.user.userId, 'Approval', 'Contracts', id, req.user.tenantId || 1);

    return res.json({ message: 'Contract approved successfully and set to Active.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getContracts,
  createContract,
  updateContract,
  deleteContract,
  approveContract
};
