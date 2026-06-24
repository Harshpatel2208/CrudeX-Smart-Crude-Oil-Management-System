import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Swal from 'sweetalert2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  }, []);

  useEffect(() => {
    fetchData();

    const handleAppRefresh = () => {
      fetchData(true);
    };

    window.addEventListener('app-refresh', handleAppRefresh);
    return () => {
      window.removeEventListener('app-refresh', handleAppRefresh);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Global Chart options for dark mode grids & labels
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
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
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

  // Monthly Sales Chart Data
  const salesChartData = {
    labels: charts?.salesHistory?.labels || [],
    datasets: [{
      label: 'Monthly Invoiced Sales (₹)',
      data: charts?.salesHistory?.data || [],
      fill: true,
      borderColor: '#38bdf8', // Sky 400
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      tension: 0.3
    }]
  };

  // Pipeline Chart Data
  const pipelineStages = charts?.pipeline || [];
  const pipelineChartData = {
    labels: pipelineStages.map(s => s.stage),
    datasets: [
      {
        label: 'Gross Value (₹)',
        data: pipelineStages.map(s => Number(s.value)),
        backgroundColor: '#38bdf8',
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

  // Lead Source Chart Data
  const leadSources = charts?.leadSource || [];
  const leadSourceChartData = {
    labels: leadSources.map(l => l.source),
    datasets: [{
      data: leadSources.map(l => l.count),
      backgroundColor: ['#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#f43f5e']
    }]
  };

  // Product Stock Level Data
  const productStock = charts?.productStock || [];
  const productStockData = {
    labels: productStock.map(p => p.product_name),
    datasets: [{
      data: productStock.map(p => Number(p.stock_quantity)),
      backgroundColor: ['#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7']
    }]
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Dashboard Overview</h2>
          <p className="text-muted text-sm">Real-time statistics & crude oil operations dashboard</p>
        </div>
        <button className="btn btn-outline-primary d-flex align-items-center" onClick={() => fetchData(true)} disabled={refreshing}>
          {refreshing ? (
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          ) : (
            <i className="bi bi-arrow-clockwise me-1"></i>
          )}
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards Row */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-sm-6 col-md-3 col-xl-2.5">
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

        <div className="col-12 col-sm-6 col-md-3 col-xl-2.5">
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

        <div className="col-12 col-sm-6 col-md-3 col-xl-2.5">
          <div className="card bg-gradient-orange text-white p-3 h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-white-50 text-xs text-uppercase mb-1">Opportunities</h6>
                <h3 className="fw-bold m-0">{stats?.totalOpportunities || 0}</h3>
              </div>
              <div className="fs-1 opacity-50"><i className="bi bi-award-fill"></i></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3 col-xl-2.5">
          <div className="card bg-gradient-orange text-white p-3 h-100" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-white-50 text-xs text-uppercase mb-1">Weighted Pipeline</h6>
                <h3 className="fw-bold m-0">₹{Number(stats?.totalWeightedPipeline || 0).toLocaleString()}</h3>
              </div>
              <div className="fs-1 opacity-50"><i className="bi bi-graph-up-arrow"></i></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3 col-xl-2.5">
          <div className="card bg-gradient-purple text-white p-3 h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-white-50 text-xs text-uppercase mb-1">Total Orders</h6>
                <h3 className="fw-bold m-0">{stats?.totalOrders || 0}</h3>
              </div>
              <div className="fs-1 opacity-50"><i className="bi bi-cart-fill"></i></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3 col-xl-2.5">
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

        <div className="col-12 col-sm-6 col-md-3 col-xl-2.5">
          <div className="card bg-secondary text-white p-3 h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-white-50 text-xs text-uppercase mb-1">Active Contracts</h6>
                <h3 className="fw-bold m-0">{stats?.activeContracts || 0}</h3>
              </div>
              <div className="fs-1 opacity-50"><i className="bi bi-file-earmark-text-fill"></i></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-lg-6">
          <div className="card p-4 h-100">
            <h5 className="fw-bold mb-3">Monthly Invoiced Sales</h5>
            <div style={{ height: '300px' }}>
              <Line data={salesChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card p-4 h-100">
            <h5 className="fw-bold mb-3">Opportunity Stage Pipeline</h5>
            <div style={{ height: '300px' }}>
              <Bar data={pipelineChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card p-4 h-100">
            <h5 className="fw-bold mb-3">Lead Source Analysis</h5>
            <div className="d-flex align-items-center justify-content-center" style={{ height: '240px' }}>
              <Doughnut data={leadSourceChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card p-4 h-100">
            <h5 className="fw-bold mb-3">Product Stock (Units)</h5>
            <div className="d-flex align-items-center justify-content-center" style={{ height: '240px' }}>
              <Doughnut data={productStockData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Deliveries Count */}
        <div className="col-12 col-md-12 col-lg-4">
          <div className="card p-4 h-100 border-0">
            <h5 className="fw-bold text-dark mb-4">Pending Shipments</h5>
            <div className="text-center py-4">
              <div className="fs-1 text-primary mb-2"><i className="bi bi-truck"></i></div>
              <h2 className="fw-extrabold text-primary">{stats?.pendingDeliveries || 0}</h2>
              <p className="text-secondary text-sm">Shipments currently processing or in transit.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Lists Row */}
      <div className="row g-4">
        {/* Recent Contracts */}
        <div className="col-12 col-lg-6">
          <div className="card p-4">
            <h5 className="fw-bold mb-3">Recent Agreements</h5>
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
                      <td className="fw-semibold">{c.customer_name}</td>
                      <td>{c.contract_number}</td>
                      <td>₹{Number(c.contract_value).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          c.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.recentContracts || stats.recentContracts.length === 0) && (
                    <tr><td colSpan="4" className="text-center text-muted">No contracts available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Logistics */}
        <div className="col-12 col-lg-6">
          <div className="card p-4">
            <h5 className="fw-bold mb-3">Logistics Dispatch Updates</h5>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Carrier</th>
                    <th>Tracking #</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentLogistics?.map(l => (
                    <tr key={l.logistics_id}>
                      <td className="fw-semibold">{l.customer_name}</td>
                      <td>{l.transporter_name}</td>
                      <td><code>{l.tracking_number}</code></td>
                      <td>
                        <span className={`badge ${
                          l.status === 'Delivered' ? 'bg-success' : l.status === 'In Transit' ? 'bg-info' : 'bg-warning'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.recentLogistics || stats.recentLogistics.length === 0) && (
                    <tr><td colSpan="4" className="text-center text-muted">No shipments found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
