import React, { useState, useEffect } from 'react';
import MobileHeader from '../components/common/MobileHeader';
import MobileMenu from '../components/common/MobileMenu';
import MobileHero from '../components/home/MobileHero';
import MobileTrustFeatures from '../components/home/MobileTrustFeatures';
import MobileCategories from '../components/home/MobileCategories';
import MobileComboCategories from '../components/home/MobileComboCategories';
import MobileProductGrid from '../components/home/MobileProductGrid';
import MobilePromotions from '../components/home/MobilePromotions';
import MobileLookbook from '../components/home/MobileLookbook';
import MobileNewsletter from '../components/home/MobileNewsletter';
import MobileFooterAccordion from '../components/common/MobileFooterAccordion';
import BottomNavbar from '../components/common/BottomNavbar';
import { getHomepageSections } from '../services/api';
import '../styles/MobileHomepage.css';

const DEFAULT_MOBILE_SECTIONS = [
  { section_key: 'hero_carousel', is_visible: true, display_order: 1 },
  { section_key: 'trust_features', is_visible: true, display_order: 2 },
  { section_key: 'shop_by_category', is_visible: true, display_order: 3 },
  { section_key: 'combo_categories', is_visible: true, display_order: 4 },
  { section_key: 'trending_arrivals', is_visible: true, display_order: 5 },
  { section_key: 'promo_offers', is_visible: true, display_order: 6 },
  { section_key: 'lookbook_banner', is_visible: true, display_order: 7 },
  { section_key: 'newsletter_section', is_visible: true, display_order: 8 }
];

const MobileHomepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sections, setSections] = useState(DEFAULT_MOBILE_SECTIONS);

  const fetchSections = async () => {
    try {
      const res = await getHomepageSections();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const sorted = [...res.data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setSections(sorted);
      } else {
        setSections(DEFAULT_MOBILE_SECTIONS);
      }
    } catch (err) {
      setSections(DEFAULT_MOBILE_SECTIONS);
    }
  };

  useEffect(() => {
    fetchSections();

    const handleUpdated = () => fetchSections();
    window.addEventListener('orderly_homepage_sections_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('orderly_homepage_sections_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, []);

  const visibleSections = sections.filter(sec => sec.is_visible !== false);
  const renderList = visibleSections.length > 0 ? visibleSections : DEFAULT_MOBILE_SECTIONS;

  const renderMobileComponent = (sec) => {
    switch (sec.section_key) {
      case 'hero_carousel':
        return <MobileHero key={sec.section_key} />;
      case 'trust_features':
        return <MobileTrustFeatures key={sec.section_key} />;
      case 'shop_by_category':
        return <MobileCategories key={sec.section_key} />;
      case 'combo_categories':
        return <div key={sec.section_key} className="orderly-deferred-section"><MobileComboCategories /></div>;
      case 'trending_arrivals':
        return <div key={sec.section_key} className="orderly-deferred-section"><MobileProductGrid /></div>;
      case 'promo_offers':
        return <div key={sec.section_key} className="orderly-deferred-section"><MobilePromotions /></div>;
      case 'lookbook_banner':
        return <div key={sec.section_key} className="orderly-deferred-section"><MobileLookbook /></div>;
      case 'newsletter_section':
        return <div key={sec.section_key} className="orderly-deferred-section"><MobileNewsletter /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="mobile-app-wrapper mobile-only">
      {/* 1. Mobile App Header */}
      <MobileHeader onOpenMenu={() => setIsMenuOpen(true)} />

      {/* 2. Mobile Slide-Out Drawer */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* 3. Dynamically Ordered & Visible Sections */}
      {renderList.map(sec => renderMobileComponent(sec))}

      {/* 4. Mobile Collapsible Footer Accordion */}
      <MobileFooterAccordion />
    </div>
  );
};

export default MobileHomepage;
