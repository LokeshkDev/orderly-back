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

import lazyWithRetry from './utils/lazyWithRetry';
import ChunkErrorBoundary from './components/common/ChunkErrorBoundary';

// Lazy-load heavy components with auto-retry
const CartDrawer = lazyWithRetry(() => import('./components/cart/CartDrawer'), 'CartDrawer');
const QuickViewModal = lazyWithRetry(() => import('./components/product/QuickViewModal'), 'QuickViewModal');
const CouponsPopupModal = lazyWithRetry(() => import('./components/common/CouponsPopupModal'), 'CouponsPopupModal');

// Lazy-load pages by feature with auto-retry on stale deployments
const Home = lazyWithRetry(() => import('./pages/Home'), 'Home');
const Shop = lazyWithRetry(() => import('./pages/Shop'), 'Shop');

// Product & Combo Detail (heavy - code split)
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'), 'ProductDetail');
const ComboDetail = lazyWithRetry(() => import('./pages/ComboDetail'), 'ComboDetail');

// Other pages
const CombosPage = lazyWithRetry(() => import('./pages/CombosPage'), 'CombosPage');
const Wishlist = lazyWithRetry(() => import('./pages/Wishlist'), 'Wishlist');
const Checkout = lazyWithRetry(() => import('./pages/Checkout'), 'Checkout');
const OrderSuccess = lazyWithRetry(() => import('./pages/OrderSuccess'), 'OrderSuccess');
const OrderFailure = lazyWithRetry(() => import('./pages/OrderFailure'), 'OrderFailure');
const AboutUs = lazyWithRetry(() => import('./pages/AboutUs'), 'AboutUs');
const ContactUs = lazyWithRetry(() => import('./pages/ContactUs'), 'ContactUs');
const ShippingPolicy = lazyWithRetry(() => import('./pages/ShippingPolicy'), 'ShippingPolicy');
const ReturnsPolicy = lazyWithRetry(() => import('./pages/ReturnsPolicy'), 'ReturnsPolicy');
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'), 'PrivacyPolicy');
const TermsAndConditions = lazyWithRetry(() => import('./pages/TermsAndConditions'), 'TermsAndConditions');
const NotFound = lazyWithRetry(() => import('./pages/NotFound'), 'NotFound');

import { trackPageView } from './utils/analytics';

// Scroll to top & SPA Analytics PageView tracker
const NavigationTracker = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Track Google Tag & Meta Pixel PageView on route change
    trackPageView(pathname + search, document.title);
  }, [pathname, search]);

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

// Global Modals with Suspense & Chunk Error Boundary
const GlobalModals = () => (
  <ChunkErrorBoundary>
    <Suspense fallback={null}>
      <CartDrawer />
      <QuickViewModal />
      <CouponsPopupModal />
    </Suspense>
  </ChunkErrorBoundary>
);

// Main Layout Wrapper conditional on route
const AppLayout = () => {
  const isAuthPage = false;

  return (
    <div className="orderly-app-wrapper">
      {!isAuthPage && <AnnouncementBar />}
      {!isAuthPage && <Navbar />}
      
      <ChunkErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/category/:slug" element={<Shop />} />
            <Route path="/collections/:slug" element={<Shop />} />
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
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ChunkErrorBoundary>

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
                <NavigationTracker />
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
