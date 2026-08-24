import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { canAccessRoute } from './utils/rbac';
import AdminLayout from './components/layout/AdminLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Real Admin Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import ProductsList from './pages/products/ProductsList';
import CombosList from './pages/combos/CombosList';

import Categories from './pages/categories/Categories';
import Occasions from './pages/occasions/Occasions';
import Brands from './pages/brands/Brands';
import HeroSlides from './pages/hero/HeroSlides';
import HomepageSettings from './pages/settings/HomepageSettings';
import SiteSettings from './pages/settings/SiteSettings';
import DeliverySettings from './pages/settings/DeliverySettings';

import OrdersList from './pages/orders/OrdersList';
import OrderDetail from './pages/orders/OrderDetail';
import CouponsList from './pages/coupons/CouponsList';
import CustomersList from './pages/customers/CustomersList';
import AdminUsersList from './pages/users/AdminUsersList';
import BIReports from './pages/analytics/BIReports';

const ProtectedRoute = ({ children }) => {
  const auth = useAuth() || {};
  const { admin, loading } = auth;
  
  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><LoadingSpinner /></div>;
  if (!admin) return <Navigate to="/login" replace />;
  
  return children;
};

const RoleRoute = ({ children, path: routePath }) => {
  const { admin } = useAuth() || {};
  const location = useLocation();
  const currentPath = routePath || location.pathname;

  if (!canAccessRoute(admin?.role, currentPath)) {
    return (
      <div className="p-5 text-center bg-white rounded border m-4 shadow-sm">
        <div className="p-3 rounded-circle bg-danger bg-opacity-10 text-danger d-inline-flex mb-3">
          <span style={{ fontSize: '2rem' }}>🚫</span>
        </div>
        <h3 className="fw-bold text-dark">Access Restricted</h3>
        <p className="text-muted max-w-md mx-auto">
          Your assigned role (<strong>{admin?.role || 'Staff'}</strong>) does not have permission to view this section.
        </p>
        <button 
          type="button" 
          className="btn btn-danger px-4 py-2 mt-2"
          onClick={() => window.location.href = '/'}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        
        <Route path="bi-reports" element={<RoleRoute path="/bi-reports"><BIReports /></RoleRoute>} />
        
        <Route path="products" element={<RoleRoute path="/products"><ProductsList /></RoleRoute>} />
        <Route path="products/new" element={<Navigate to="/products" replace />} />
        <Route path="products/edit/:id" element={<Navigate to="/products" replace />} />
        <Route path="combos" element={<RoleRoute path="/combos"><CombosList /></RoleRoute>} />

        <Route path="categories" element={<RoleRoute path="/categories"><Categories /></RoleRoute>} />
        <Route path="occasions" element={<RoleRoute path="/homepage-settings"><HomepageSettings defaultTab="occasions" /></RoleRoute>} />
        <Route path="brands" element={<RoleRoute path="/homepage-settings"><Brands /></RoleRoute>} />
        <Route path="homepage-settings" element={<RoleRoute path="/homepage-settings"><HomepageSettings /></RoleRoute>} />
        <Route path="hero-slides" element={<RoleRoute path="/homepage-settings"><HomepageSettings defaultTab="carousel" /></RoleRoute>} />
        <Route path="settings" element={<RoleRoute path="/settings"><SiteSettings /></RoleRoute>} />
        <Route path="settings/delivery" element={<RoleRoute path="/settings/delivery"><DeliverySettings /></RoleRoute>} />
        
        <Route path="orders" element={<RoleRoute path="/orders"><OrdersList /></RoleRoute>} />
        <Route path="orders/:id" element={<RoleRoute path="/orders"><OrderDetail /></RoleRoute>} />
        <Route path="coupons" element={<RoleRoute path="/coupons"><CouponsList /></RoleRoute>} />
        <Route path="customers" element={<RoleRoute path="/customers"><CustomersList /></RoleRoute>} />
        <Route path="admin-users" element={<RoleRoute path="/admin-users"><AdminUsersList /></RoleRoute>} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer theme="dark" position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
