import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
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

import OrdersList from './pages/orders/OrdersList';
import OrderDetail from './pages/orders/OrderDetail';
import CouponsList from './pages/coupons/CouponsList';
import CustomersList from './pages/customers/CustomersList';

const ProtectedRoute = ({ children }) => {
  const auth = useAuth() || {};
  const { admin, loading } = auth;
  
  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><LoadingSpinner /></div>;
  if (!admin) return <Navigate to="/login" replace />;
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        
        <Route path="products" element={<ProductsList />} />
        {/* Legacy demo product editor removed; product editing happens in ProductsList's DB-backed modal */}
        <Route path="products/new" element={<Navigate to="/products" replace />} />
        <Route path="products/edit/:id" element={<Navigate to="/products" replace />} />
        <Route path="combos" element={<CombosList />} />

        <Route path="categories" element={<Categories />} />
        <Route path="occasions" element={<HomepageSettings defaultTab="occasions" />} />
        <Route path="brands" element={<Brands />} />
        <Route path="homepage-settings" element={<HomepageSettings />} />
        <Route path="hero-slides" element={<HomepageSettings defaultTab="carousel" />} />
        <Route path="settings" element={<SiteSettings />} />
        
        <Route path="orders" element={<OrdersList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="coupons" element={<CouponsList />} />
        <Route path="customers" element={<CustomersList />} />
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
