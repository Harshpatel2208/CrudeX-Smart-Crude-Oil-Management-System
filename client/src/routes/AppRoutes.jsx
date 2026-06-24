import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

// Import Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Customers from '../pages/Customers';
import Leads from '../pages/Leads';
import Opportunities from '../pages/Opportunities';
import Products from '../pages/Products';
import Contracts from '../pages/Contracts';
import Orders from '../pages/Orders';
import Logistics from '../pages/Logistics';
import Invoices from '../pages/Invoices';
import Payments from '../pages/Payments';
import ActivityLogs from '../pages/ActivityLogs';
import Team from '../pages/Team';

// Protected Route Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />; // Redirect unauthorized roles to dashboard
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routing */}
          <Route path="/login" element={<Login />} />

          {/* Protected Layout Routing */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            
            {/* Sales pipeline features restricted for Clients */}
            <Route 
              path="leads" 
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'CompanyAdmin', 'Manager', 'Employee']}>
                  <Leads />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="opportunities" 
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'CompanyAdmin', 'Manager', 'Employee']}>
                  <Opportunities />
                </ProtectedRoute>
              } 
            />
            
            <Route path="products" element={<Products />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="orders" element={<Orders />} />
            <Route path="logistics" element={<Logistics />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
            
            {/* Admin/Manager/Employee permissions for Activity Logs */}
            <Route
              path="activity-logs"
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'CompanyAdmin', 'Manager', 'Employee']}>
                  <ActivityLogs />
                </ProtectedRoute>
              }
            />
            
            {/* Team settings only for Admins */}
            <Route
              path="team"
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'CompanyAdmin']}>
                  <Team />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default AppRoutes;
