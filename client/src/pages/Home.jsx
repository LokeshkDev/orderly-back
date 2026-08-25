import React, { useState, useEffect } from 'react';
import SEOHead from '../components/common/SEOHead';
import HeroCarousel from '../components/home/HeroCarousel';
import TrustFeaturesStrip from '../components/home/TrustFeaturesStrip';
import ShopByCategory from '../components/home/ShopByCategory';
import ComboCategories from '../components/home/ComboCategories';
import TrendingArrivalsSection from '../components/home/TrendingArrivalsSection';
import PromoSection from '../components/home/PromoSection';
import LookbookSection from '../components/home/LookbookSection';
import VideoBannerSection from '../components/home/VideoBannerSection';
import ShopByOccasion from '../components/home/ShopByOccasion';
import CatchyCombosSection from '../components/home/CatchyCombosSection';
import Newsletter from '../components/home/Newsletter';
import MobileHomepage from './MobileHomepage';
import { getHomepageSections } from '../services/api';
import useIsMobile from '../utils/useIsMobile';

const DEFAULT_HOMEPAGE_SECTIONS = [
  { section_key: 'hero_carousel', title: 'Hero Carousel', is_visible: true, display_order: 1 },
  { section_key: 'trust_features', title: 'Trust & Service Features Bar', is_visible: true, display_order: 2 },
  { section_key: 'shop_by_category', title: 'DISCOVER YOUR STYLE', is_visible: true, display_order: 3 },
  { section_key: 'combo_categories', title: 'EXPLORE COMBO CATEGORIES', is_visible: true, display_order: 4 },
  { section_key: 'trending_arrivals', title: 'BEST SELLING PRODUCTS', is_visible: true, display_order: 5 },
  { section_key: 'promo_offers', title: 'Promotional Offers', is_visible: true, display_order: 6 },
  { section_key: 'lookbook_banner', title: 'The Lookbook 2026', is_visible: true, display_order: 7 },
  { section_key: 'newsletter_section', title: 'Newsletter VIP Club', is_visible: true, display_order: 8 },
  { section_key: 'video_banner', title: 'Video Banner', is_visible: false, display_order: 9 },
  { section_key: 'shop_by_occasion', title: 'Shop by Occasion', is_visible: false, display_order: 10 },
  { section_key: 'featured_brands', title: 'Catchy Combo Bundles', is_visible: false, display_order: 11 }
];

const Home = () => {
  const isMobile = useIsMobile(768);
  const [sections, setSections] = useState(DEFAULT_HOMEPAGE_SECTIONS);

  const fetchSections = async () => {
    try {
      const res = await getHomepageSections();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const sorted = [...res.data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setSections(sorted);
      } else {
        setSections(DEFAULT_HOMEPAGE_SECTIONS);
      }
    } catch {
      setSections(DEFAULT_HOMEPAGE_SECTIONS);
    }
  };

  useEffect(() => {
    fetchSections();

    const handleSectionsUpdated = () => {
      fetchSections();
    };

    window.addEventListener('orderly_homepage_sections_updated', handleSectionsUpdated);
    window.addEventListener('storage', handleSectionsUpdated);
    return () => {
      window.removeEventListener('orderly_homepage_sections_updated', handleSectionsUpdated);
      window.removeEventListener('storage', handleSectionsUpdated);
    };
  }, []);

  const visibleSections = sections.filter(sec => sec.is_visible !== false);
  const renderList = visibleSections.length > 0 ? visibleSections : DEFAULT_HOMEPAGE_SECTIONS;

  const renderSectionComponent = (sec) => {
    switch (sec.section_key) {
      case 'hero_carousel':
        return <HeroCarousel key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'trust_features':
        return <TrustFeaturesStrip key={sec.section_key} />;
      case 'shop_by_category':
        return <ShopByCategory key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'combo_categories':
        return <ComboCategories key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'trending_arrivals':
        return <TrendingArrivalsSection key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'promo_offers':
        return <PromoSection key={sec.section_key} />;
      case 'lookbook_banner':
        return <LookbookSection key={sec.section_key} />;
      case 'video_banner':
        return <VideoBannerSection key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'shop_by_occasion':
        return <ShopByOccasion key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'featured_brands':
        return <CatchyCombosSection key={sec.section_key} title={sec.title || "Catchy Combo Bundles & Curated Sets"} subtitle={sec.subtitle || "EXCLUSIVE MULTI-PIECE BUNDLE SAVINGS"} />;
      case 'newsletter_section':
        return <Newsletter key={sec.section_key} />;
      default:
        return null;
    }
  };

  return (
    <>
      <SEOHead 
        title="ORDERLY Mens Wear | Luxury Men's Apparel & Fashion Store"
        description="Discover luxury men's fashion by ORDERLY. Shop shirts, oversized tees, selvedge denim, and blazers."
        canonicalPath="/"
      />
      {/* Viewport-conditional mounting to eliminate duplicate DOM/API load */}
      {isMobile ? (
        <MobileHomepage />
      ) : (
        <main className="orderly-home-page desktop-only" style={{ backgroundColor: '#050505' }}>
          {renderList.map(sec => renderSectionComponent(sec))}
        </main>
      )}
    </>
  );
};

export default Home;
