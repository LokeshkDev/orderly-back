import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import HeroCarousel from '../components/home/HeroCarousel';
import ShopByCategory from '../components/home/ShopByCategory';
import VideoBannerSection from '../components/home/VideoBannerSection';
import ShopByOccasion from '../components/home/ShopByOccasion';
import TrendingArrivalsSection from '../components/home/TrendingArrivalsSection';
import CatchyCombosSection from '../components/home/CatchyCombosSection';
import { getHomepageSections } from '../services/api';

const DEFAULT_HOMEPAGE_SECTIONS = [
  { section_key: 'hero_carousel', title: 'Hero Carousel', is_visible: true, display_order: 1 },
  { section_key: 'shop_by_category', title: 'Shop by Category', is_visible: true, display_order: 2 },
  { section_key: 'video_banner', title: 'Video Banner', is_visible: true, display_order: 3 },
  { section_key: 'shop_by_occasion', title: 'Shop by Occasion', is_visible: true, display_order: 4 },
  { section_key: 'trending_arrivals', title: 'Trending Arrivals', is_visible: true, display_order: 5 },
  { section_key: 'featured_brands', title: 'Catchy Combo Bundles', is_visible: true, display_order: 6 }
];

const Home = () => {
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
    } catch (err) {
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
      case 'shop_by_category':
        return <ShopByCategory key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'video_banner':
        return <VideoBannerSection key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'shop_by_occasion':
        return <ShopByOccasion key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'trending_arrivals':
        return <TrendingArrivalsSection key={sec.section_key} title={sec.title} subtitle={sec.subtitle} />;
      case 'featured_brands':
        return <CatchyCombosSection key={sec.section_key} title={sec.title || "Catchy Combo Bundles & Curated Sets"} subtitle={sec.subtitle || "EXCLUSIVE MULTI-PIECE BUNDLE SAVINGS"} />;
      default:
        return null;
    }
  };

  return (
    <>
      <SEO 
        title="ORDERLY Mens Wear | Luxury Men's Apparel & Fashion Store"
        description="Discover luxury men's fashion by ORDERLY. Shop shirts, oversized tees, selvedge denim, and blazers."
      />
      <main className="orderly-home-page">
        {renderList.map(sec => renderSectionComponent(sec))}
      </main>
    </>
  );
};

export default Home;
