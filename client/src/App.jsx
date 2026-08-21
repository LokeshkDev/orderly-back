import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { QuickViewProvider } from './context/QuickViewContext';

// Common Components (always loaded)
import AnnouncementBar from './components/common/AnnouncementBar';
import Navbar from './components/common/Navbar';
import BottomNavbar from './components/common/BottomNavbar';
import Footer from './components/common/Footer';
import PageLoader from './components/common/PageLoader';

// Lazy-load heavy components
const CartDrawer = lazy(() => import('./components/cart/CartDrawer'));
const QuickViewModal = lazy(() => import('./components/product/QuickViewModal'));

// Lazy-load pages by feature
// Home & Shop (critical - load first)
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));

// Product & Combo Detail (heavy - code split)
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const ComboDetail = lazy(() => import('./pages/ComboDetail'));

// Other pages
const CombosPage = lazy(() => import('./pages/CombosPage'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderFailure = lazy(() => import('./pages/OrderFailure'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const ReturnsPolicy = lazy(() => import('./pages/ReturnsPolicy'));

// Mobile views (separate chunk)
const MobileHomepage = lazy(() => import('./pages/MobileHomepage'));
const MobileShop = lazy(() => import('./pages/MobileShop'));
const MobileCombos = lazy(() => import('./pages/MobileCombos'));

// Scroll to top helper
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Suspense fallback component
const PageSkeleton = () => (
  <div className="page-skeleton" role="status" aria-label="Loading page">
    <div className="skeleton-header" />
    <div className="skeleton-content">
      <div className="skeleton-section" />
      <div className="skeleton-section" />
      <div className="skeleton-section" />
    </div>
  </div>
);

// Global Modals with Suspense
const GlobalModals = () => (
  <Suspense fallback={null}>
    <CartDrawer />
    <QuickViewModal />
  </Suspense>
);

// Main Layout Wrapper conditional on route
const AppLayout = () => {
  const isAuthPage = false;

  return (
    <div className="orderly-app-wrapper">
      {!isAuthPage && <AnnouncementBar />}
      {!isAuthPage && <Navbar />}
      
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/combo/:id" element={<ComboDetail />} />
          <Route path="/combos" element={<CombosPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/order-failure" element={<OrderFailure />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/returns-policy" element={<ReturnsPolicy />} />
        </Routes>
      </Suspense>

      {!isAuthPage && <Footer />}
      {!isAuthPage && <BottomNavbar />}

      {/* Global Modals & Drawers */}
      <GlobalModals />
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
                <PageLoader />
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
