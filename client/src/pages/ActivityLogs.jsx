import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity-logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve system activity logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'Login': return 'bg-info text-dark';
      case 'Add': return 'bg-success';
      case 'Update': return 'bg-warning text-dark';
      case 'Delete': return 'bg-danger';
      case 'Approval': return 'bg-purple text-white'; // Custom css color if wanted, or standard primary
      default: return 'bg-secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">System Activity Logs</h2>
          <p className="text-muted text-sm">Automated system audit trail for security audits and actions monitoring</p>
        </div>
        <button className="btn btn-outline-primary" onClick={fetchLogs}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Logs
        </button>
      </div>

      {/* Activity Logs Listing */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Affected Record ID</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status"></div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No activities recorded in logs.</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.log_id}>
                      <td>
                        <span className="fw-semibold">{new Date(log.timestamp).toLocaleString()}</span>
                      </td>
                      <td className="fw-bold text-dark">{log.user_name}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{log.user_role}</span>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="fw-semibold">{log.module}</td>
                      <td>
                        {log.record_id ? (
                          <span className="badge bg-secondary-subtle text-dark">ID: {log.record_id}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
