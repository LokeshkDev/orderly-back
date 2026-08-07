import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { QuickViewProvider } from './context/QuickViewContext';
import { HomepageSectionsProvider } from './context/HomepageSectionsContext';

// Common Components
import AnnouncementBar from './components/common/AnnouncementBar';
import Navbar from './components/common/Navbar';
import BottomNavbar from './components/common/BottomNavbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import QuickViewModal from './components/product/QuickViewModal';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import ComboDetail from './pages/ComboDetail';
import CombosPage from './pages/CombosPage';
import Wishlist from './pages/Wishlist';
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import CustomerProfile from './pages/CustomerProfile';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderFailure from './pages/OrderFailure';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import ShippingPolicy from './pages/ShippingPolicy';
import ReturnsPolicy from './pages/ReturnsPolicy';

// Scroll to top helper
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Main Layout Wrapper conditional on route
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="orderly-app-wrapper">
      {!isAuthPage && <AnnouncementBar />}
      {!isAuthPage && <Navbar />}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/combo/:id" element={<ComboDetail />} />
        <Route path="/combos" element={<CombosPage />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/profile" element={<CustomerProfile />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/order-failure" element={<OrderFailure />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/returns-policy" element={<ReturnsPolicy />} />
      </Routes>

      {!isAuthPage && <Footer />}
      {!isAuthPage && <BottomNavbar />}

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <QuickViewModal />
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <CartProvider>
          <WishlistProvider>
            <QuickViewProvider>
              <Router>
                <ScrollToTop />
                <AppLayout />
              </Router>
            </QuickViewProvider>
          </WishlistProvider>
        </CartProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
