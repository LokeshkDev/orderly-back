import React, { useState } from 'react';
import MobileHeader from '../components/common/MobileHeader';
import MobileMenu from '../components/common/MobileMenu';
import MobileHero from '../components/home/MobileHero';
import MobileTrustFeatures from '../components/home/MobileTrustFeatures';
import MobileCategories from '../components/home/MobileCategories';
import MobileProductGrid from '../components/home/MobileProductGrid';
import MobilePromotions from '../components/home/MobilePromotions';
import MobileLookbook from '../components/home/MobileLookbook';
import MobileNewsletter from '../components/home/MobileNewsletter';
import MobileCustomerReviews from '../components/home/MobileCustomerReviews';
import MobileFooterAccordion from '../components/common/MobileFooterAccordion';
import BottomNavbar from '../components/common/BottomNavbar';
import '../styles/MobileHomepage.css';

const MobileHomepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="mobile-app-wrapper mobile-only">
      {/* 1. Mobile App Header */}
      <MobileHeader onOpenMenu={() => setIsMenuOpen(true)} />

      {/* 3. Mobile Slide-Out Drawer */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* 4. Mobile Hero Slider */}
      <MobileHero />

      {/* 5. Trust / Service Features */}
      <MobileTrustFeatures />

      {/* 6. Discover Your Style (Horizontal Category Swipe) */}
      <MobileCategories />

      {/* 7. Best Selling Products (2-Column Grid) */}
      <MobileProductGrid />

      {/* 8. Stacked Promotions (Combo Offers, 50% OFF, New Arrivals) */}
      <MobilePromotions />

      {/* 9. Mobile Lookbook 2026 */}
      <MobileLookbook />

      {/* 10. Mobile Newsletter VIP Club */}
      <MobileNewsletter />

      {/* 11. Customer Reviews & Benefits Strips */}
      <MobileCustomerReviews />

      {/* 12. Mobile Collapsible Footer Accordion */}
      <MobileFooterAccordion />

      {/* 13. Fixed Mobile Bottom Navigation Bar */}
      <BottomNavbar />
    </div>
  );
};

export default MobileHomepage;
