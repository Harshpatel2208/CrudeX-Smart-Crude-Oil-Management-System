import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Swal from 'sweetalert2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [benchmarks, setBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);

  // Approvals Lists (Contracts and Orders)
  const [pendingContracts, setPendingContracts] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  const fetchApprovals = useCallback(async () => {
    if (['SuperAdmin', 'CompanyAdmin', 'Manager'].includes(user?.role)) {
      try {
        const [contractsRes, ordersRes] = await Promise.all([
          api.get('/contracts?status=Pending Approval'),
          api.get('/orders') // We will client-side filter or fetch pending
        ]);
        setPendingContracts(contractsRes.data);
        setPendingOrders(ordersRes.data.filter(o => o.status === 'Pending Approval'));
      } catch (error) {
        console.error('Failed to load approvals queue:', error);
      }
    }
  }, [user]);

  const fetchBenchmarks = useCallback(async () => {
    try {
      const res = await api.get('/products/benchmarks');
      setBenchmarks(res.data);
    } catch (error) {
      console.error('Failed to load benchmarks:', error);
    }
  }, []);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [statsRes, chartsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts')
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
      await fetchBenchmarks();
      await fetchApprovals();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch dashboard data.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchBenchmarks, fetchApprovals]);

  useEffect(() => {
    fetchData();

    // Auto-poll benchmarks every 15 seconds to simulate a live market feed
    const interval = setInterval(() => {
      fetchBenchmarks();
    }, 15000);

    const handleAppRefresh = () => {
      fetchData(true);
    };

    window.addEventListener('app-refresh', handleAppRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('app-refresh', handleAppRefresh);
    };
  }, [fetchData, fetchBenchmarks]);

  // Market fluctuation simulator
  const handleMarketFluctuate = async () => {
    setMarketLoading(true);
    try {
      const res = await api.post('/products/benchmarks/fluctuate');
      setBenchmarks(res.data.benchmarks);
      
      // Fire small toast alert
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      Toast.fire({
        icon: 'info',
        title: 'Oil indices updated. Product catalog prices adjusted.'
      });

      // Refresh dashboard charts to show dynamic pricing updates
      const chartsRes = await api.get('/dashboard/charts');
      setCharts(chartsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setMarketLoading(false);
    }
  };

  // Approval handlers
  const handleApproveContract = async (id) => {
    try {
      await api.put(`/contracts/${id}/approve`);
      Swal.fire({
        icon: 'success',
        title: 'Contract Approved',
        text: 'The agreement status is now set to Active.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchData(true);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to approve.' });
    }
  };

  const handleApproveOrder = async (id) => {
    try {
      await api.put(`/orders/${id}/approve`);
      Swal.fire({
        icon: 'success',
        title: 'Order Approved',
        text: 'Order sent to Processing and logistics Scheduled.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchData(true);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to approve.' });
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 11 }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 10 }
        }
      }
    }
  };

  const salesChartData = {
    labels: charts?.salesHistory?.labels || [],
    datasets: [{
      label: 'Monthly Invoiced Sales (₹)',
      data: charts?.salesHistory?.data || [],
      fill: true,
      borderColor: '#ffc107',
      backgroundColor: 'rgba(255, 193, 7, 0.05)',
      tension: 0.3
    }]
  };

  const pipelineStages = charts?.pipeline || [];
  const pipelineChartData = {
    labels: pipelineStages.map(s => s.stage),
    datasets: [
      {
        label: 'Gross Value (₹)',
        data: pipelineStages.map(s => Number(s.value)),
        backgroundColor: '#3b82f6',
        borderRadius: 6
      },
      {
        label: 'Weighted Value (₹)',
        data: pipelineStages.map(s => Number(s.weighted_value)),
        backgroundColor: '#10b981',
        borderRadius: 6
      }
    ]
  };

  const leadSources = charts?.leadSource || [];
  const leadSourceChartData = {
    labels: leadSources.map(l => l.source),
    datasets: [{
      data: leadSources.map(l => l.count),
      backgroundColor: ['#3b82f6', '#10b981', '#ffc107', '#a855f7', '#f43f5e']
    }]
  };

  const productStock = charts?.productStock || [];
  const productStockData = {
    labels: productStock.map(p => p.product_name),
    datasets: [{
      data: productStock.map(p => Number(p.stock_quantity)),
      backgroundColor: ['#3b82f6', '#10b981', '#ffc107', '#f43f5e', '#a855f7']
    }]
  };

  // RENDER CORRESPONDING DASHBOARD
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isClient = user?.role === 'Client';

  return (
    <div>
      {/* 1. Dynamic Oil Index Price Ticker Row (Tenant & Client view) */}
      {!isSuperAdmin && benchmarks.length > 0 && (
        <div className="card border-0 shadow-sm p-3 mb-4 rounded-3 text-white" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
              <small className="text-secondary fw-semibold uppercase tracking-wider text-xs">Live Oil Price Feed (Bbl)</small>
            </div>
            
            <div className="d-flex flex-wrap gap-4 align-items-center">
              {benchmarks.map(b => {
                const simulatedChange = Number((Math.sin(Date.now() / 20000 + b.benchmark_id) * 0.25).toFixed(2));
                const isPositive = simulatedChange >= 0;
                return (
                  <div key={b.benchmark_id} className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-light text-sm">{b.name === 'Brent Crude' ? 'Brent' : b.name.includes('WTI') ? 'WTI' : 'Dubai'}:</span>
                    <span className="fw-semibold text-warning text-sm">₹{Number(b.current_price).toFixed(2)}</span>
                    <span className={`text-xs d-flex align-items-center ${isPositive ? 'text-success' : 'text-danger'}`}>
                      <i className={`bi ${isPositive ? 'bi-caret-up-fill' : 'bi-caret-down-fill'} me-0.5`}></i>
                      {isPositive ? '+' : ''}{simulatedChange}%
                    </span>
                  </div>
                );
              })}

              {/* Fluctuation triggers */}
              {['CompanyAdmin', 'Manager'].includes(user?.role) && (
                <button 
                  className="btn btn-warning btn-sm py-1 px-2 fw-semibold text-dark d-flex align-items-center gap-1" 
                  onClick={handleMarketFluctuate}
                  disabled={marketLoading}
                >
                  {marketLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    <i className="bi bi-activity"></i>
                  )}
                  Simulate Fluctuation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-white mb-0">
            {isSuperAdmin ? 'SaaS Platform Control Panel' : isClient ? 'Client Operations Hub' : 'Operations Dashboard'}
          </h2>
          <p className="text-muted text-sm">
            {isSuperAdmin 
              ? 'Multi-Tenant System Analytics & Global Audits' 
              : `Logged in as ${user?.name} (${user?.role}) under Demo Oil Co.`}
          </p>
        </div>
        <button className="btn btn-outline-warning d-flex align-items-center" onClick={() => fetchData(true)} disabled={refreshing}>
          {refreshing ? (
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          ) : (
            <i className="bi bi-arrow-clockwise me-1"></i>
          )}
          Refresh Dashboard
        </button>
      </div>

      {/* =========================================================================
          VIEW A: SUPER ADMIN DASHBOARD
          ========================================================================= */}
      {isSuperAdmin && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-4">
              <div className="card bg-gradient-blue text-white p-4 shadow-sm border-0 rounded-3">
                <h6 className="text-white-50 uppercase text-xs">Total SaaS Tenants</h6>
                <h2 className="fw-bold mb-0">{stats?.superAdminStats?.tenantCount || 0} Companies</h2>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card bg-gradient-green text-white p-4 shadow-sm border-0 rounded-3">
                <h6 className="text-white-50 uppercase text-xs">Platform Status</h6>
                <h2 className="fw-bold mb-0">Healthy (100% Uptime)</h2>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card bg-gradient-orange text-white p-4 shadow-sm border-0 rounded-3">
                <h6 className="text-white-50 uppercase text-xs">System Users</h6>
                <h2 className="fw-bold mb-0">{stats?.totalCustomers || 0} Active Staff</h2>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm p-4 mb-4 text-white" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <h5 className="fw-bold mb-3"><i className="bi bi-building me-2 text-warning"></i>Recently Provisioned Companies</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Subdomain</th>
                    <th>Owner Email</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.superAdminStats?.tenantsList?.map(t => (
                    <tr key={t.tenant_id}>
                      <td className="fw-bold">{t.company_name}</td>
                      <td><code>{t.subdomain || 'n/a'}</code></td>
                      <td>{t.owner_email}</td>
                      <td>
                        <span className={`badge ${t.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>{t.status}</span>
                      </td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(!stats?.superAdminStats?.tenantsList || stats.superAdminStats.tenantsList.length === 0) && (
                    <tr><td colSpan="5" className="text-center text-muted">No tenants provisioned.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW B: CLIENT DASHBOARD
          ========================================================================= */}
      {isClient && (
        <div className="row g-4">
          <div className="col-12 col-md-3">
            <div className="card bg-gradient-blue text-white p-3">
              <h6 className="text-white-50 uppercase text-xs">My Ordered Batches</h6>
              <h3 className="fw-bold m-0">{stats?.totalOrders || 0}</h3>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card bg-gradient-cyan text-white p-3">
              <h6 className="text-white-50 uppercase text-xs">Paid To Date</h6>
              <h3 className="fw-bold m-0">₹{Number(stats?.totalRevenue || 0).toLocaleString()}</h3>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card bg-gradient-purple text-white p-3">
              <h6 className="text-white-50 uppercase text-xs">Active Agreements</h6>
              <h3 className="fw-bold m-0">{stats?.activeContracts || 0}</h3>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card bg-secondary text-white p-3">
              <h6 className="text-white-50 uppercase text-xs">Pending Deliveries</h6>
              <h3 className="fw-bold m-0">{stats?.pendingDeliveries || 0}</h3>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card p-4 h-100">
              <h5 className="fw-bold mb-3 text-white"><i className="bi bi-file-earmark-text me-2 text-warning"></i>Active Supply Agreements</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Contract Number</th>
                      <th>Value</th>
                      <th>End Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentContracts?.map(c => (
                      <tr key={c.contract_id}>
                        <td><code>{c.contract_number}</code></td>
                        <td>₹{Number(c.contract_value).toLocaleString()}</td>
                        <td>{new Date(c.end_date).toLocaleDateString()}</td>
                        <td><span className="badge bg-success-subtle text-success">{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card p-4 h-100">
              <h5 className="fw-bold mb-3 text-white"><i className="bi bi-truck me-2 text-warning"></i>Shipments Dispatch Track</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Carrier</th>
                      <th>Tracking #</th>
                      <th>Transit Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentLogistics?.map(l => (
                      <tr key={l.logistics_id}>
                        <td>{l.transporter_name}</td>
                        <td><code>{l.tracking_number}</code></td>
                        <td>
                          <span className={`badge ${l.status === 'Delivered' ? 'bg-success' : 'bg-info'}`}>{l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW C: STANDARD MULTI-TENANT CRM DASHBOARD (Staff, Managers, Tenant Owner)
          ========================================================================= */}
      {!isSuperAdmin && !isClient && (
        <>
          {/* Summary Cards */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-sm-6 col-md-3">
              <div className="card bg-gradient-blue text-white p-3 h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white-50 text-xs text-uppercase mb-1">Total Customers</h6>
                    <h3 className="fw-bold m-0">{stats?.totalCustomers || 0}</h3>
                  </div>
                  <div className="fs-1 opacity-50"><i className="bi bi-people-fill"></i></div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <div className="card bg-gradient-green text-white p-3 h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white-50 text-xs text-uppercase mb-1">Total Leads</h6>
                    <h3 className="fw-bold m-0">{stats?.totalLeads || 0}</h3>
                  </div>
                  <div className="fs-1 opacity-50"><i className="bi bi-funnel-fill"></i></div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <div className="card bg-gradient-orange text-white p-3 h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white-50 text-xs text-uppercase mb-1">Weighted Pipeline</h6>
                    <h3 className="fw-bold m-0">₹{Number(stats?.totalWeightedPipeline || 0).toLocaleString()}</h3>
                  </div>
                  <div className="fs-1 opacity-50"><i className="bi bi-graph-up-arrow"></i></div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <div className="card bg-gradient-cyan text-white p-3 h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white-50 text-xs text-uppercase mb-1">Revenue Paid</h6>
                    <h3 className="fw-bold m-0">₹{Number(stats?.totalRevenue || 0).toLocaleString()}</h3>
                  </div>
                  <div className="fs-1 opacity-50"><i className="bi bi-currency-rupee"></i></div>
                </div>
              </div>
            </div>
          </div>

          {/* Approvals Alerts Queue Row (Premium Feature) */}
          {['CompanyAdmin', 'Manager'].includes(user?.role) && (pendingContracts.length > 0 || pendingOrders.length > 0) && (
            <div className="card border-0 shadow-sm p-4 mb-4 text-white" style={{ background: 'rgba(255, 193, 7, 0.05)', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
              <h5 className="fw-bold mb-3 text-warning"><i className="bi bi-shield-lock-fill me-2"></i>Management Approval Required</h5>
              <div className="row g-3">
                {pendingContracts.map(c => (
                  <div key={c.contract_id} className="col-12 col-md-6">
                    <div className="p-3 rounded border border-warning border-opacity-25 bg-black bg-opacity-20 d-flex justify-content-between align-items-center">
                      <div>
                        <span className="badge bg-warning text-dark mb-1">Contract Approval</span>
                        <div className="fw-bold text-white">{c.customer_name}</div>
                        <small className="text-muted">No: {c.contract_number} | Value: ₹{Number(c.contract_value).toLocaleString()}</small>
                      </div>
                      <button className="btn btn-warning btn-sm fw-bold" onClick={() => handleApproveContract(c.contract_id)}>Approve</button>
                    </div>
                  </div>
                ))}

                {pendingOrders.map(o => (
                  <div key={o.order_id} className="col-12 col-md-6">
                    <div className="p-3 rounded border border-warning border-opacity-25 bg-black bg-opacity-20 d-flex justify-content-between align-items-center">
                      <div>
                        <span className="badge bg-warning text-dark mb-1">Order Approval</span>
                        <div className="fw-bold text-white">{o.customer_name}</div>
                        <small className="text-muted">No: {o.order_number} | Value: ₹{Number(o.total_amount).toLocaleString()}</small>
                      </div>
                      <button className="btn btn-warning btn-sm fw-bold" onClick={() => handleApproveOrder(o.order_id)}>Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-8">
              <div className="card p-4 h-100">
                <h5 className="fw-bold mb-3 text-white">Monthly Sales Pipeline</h5>
                <div style={{ height: '320px' }}>
                  <Line data={salesChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="card p-4 h-100">
                <h5 className="fw-bold mb-3 text-white">Inventory Stock Levels</h5>
                <div className="d-flex align-items-center justify-content-center" style={{ height: '260px' }}>
                  <Doughnut data={productStockData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Analytics Widgets Row (Premium Features) */}
          <div className="row g-4 mb-4">
            {/* 1. Depletion Forecasting Widget */}
            <div className="col-12 col-lg-6">
              <div className="card p-4 h-100">
                <h5 className="fw-bold text-white mb-3">
                  <i className="bi bi-hourglass-split me-2 text-warning"></i>Product Stock Depletion Forecast
                </h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Product Grade</th>
                        <th>Current Stock</th>
                        <th>Avg Daily Burn</th>
                        <th>Est. Run-Out Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charts?.depletionForecast?.map((f, i) => (
                        <tr key={i}>
                          <td className="fw-bold">{f.productName}</td>
                          <td>{Number(f.stock).toLocaleString()} Bbl</td>
                          <td>{f.avgDaily} Bbl/day</td>
                          <td>
                            {f.daysRemaining === 'No consumption' ? (
                              <span className="text-secondary text-xs">No active shipments</span>
                            ) : Number(f.daysRemaining) < 15 ? (
                              <span className="badge bg-danger text-white">{f.daysRemaining} Days (Critically Low)</span>
                            ) : (
                              <span className="badge bg-success-subtle text-success">{f.daysRemaining} Days</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 2. Customer Credit Risk Aging Widget */}
            <div className="col-12 col-lg-6">
              <div className="card p-4 h-100">
                <h5 className="fw-bold text-white mb-3">
                  <i className="bi bi-exclamation-triangle me-2 text-warning"></i>Customer Outstanding Credit Risk
                </h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Customer Company</th>
                        <th>Unpaid Receivables</th>
                        <th>Oldest Aging Bill</th>
                        <th>Risk Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charts?.creditRisk?.map((r, i) => (
                        <tr key={i}>
                          <td className="fw-semibold">{r.companyName}</td>
                          <td>₹{Number(r.outstanding).toLocaleString()}</td>
                          <td>{r.oldestInvoiceDays} days ago</td>
                          <td>
                            <span className={`badge ${
                              r.risk === 'High' ? 'bg-danger' : r.risk === 'Medium' ? 'bg-warning text-dark' : 'bg-success'
                            }`}>{r.risk} Risk</span>
                          </td>
                        </tr>
                      ))}
                      {(!charts?.creditRisk || charts.creditRisk.length === 0) && (
                        <tr><td colSpan="4" className="text-center text-muted">All customers are fully paid up.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Lists */}
          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <div className="card p-4 h-100">
                <h5 className="fw-bold mb-3 text-white">Active Agreements</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>No.</th>
                        <th>Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentContracts?.map(c => (
                        <tr key={c.contract_id}>
                          <td className="fw-semibold text-light">{c.customer_name}</td>
                          <td><code>{c.contract_number}</code></td>
                          <td>₹{Number(c.contract_value).toLocaleString()}</td>
                          <td><span className="badge bg-success-subtle text-success">{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card p-4 h-100">
                <h5 className="fw-bold mb-3 text-white">Active Pipeline Transit status</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Tracking #</th>
                        <th>Transit Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentLogistics?.map(l => (
                        <tr key={l.logistics_id}>
                          <td className="fw-semibold text-light">{l.customer_name}</td>
                          <td><code>{l.tracking_number}</code></td>
                          <td>
                            <span className={`badge ${l.status === 'Delivered' ? 'bg-success' : l.status === 'In Transit' ? 'bg-info' : 'bg-warning'}`}>{l.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
