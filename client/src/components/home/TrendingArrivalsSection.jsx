import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiZap, FiPlus } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import ProductCard from '../product/ProductCard';
import { getProducts, getSettings } from '../../services/api';
import { HomeTrendingSkeleton } from '../common/Skeleton';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './TrendingArrivalsSection.css';

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-001',
    slug: 'essential-cotton-crewneck',
    name: 'Essential Heavyweight Cotton Crewneck Tee',
    price: 1499,
    original_price: 2499,
    rating: 4.8,
    reviews_count: 142,
    badge: 'BESTSELLER',
    is_bestseller: true,
    category: 'Tops & T-Shirts',
    brand: 'ORDERLY STUDIO',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Onyx Black', hex: '#0B0B0B' },
      { name: 'Pure White', hex: '#FFFFFF' }
    ],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'prod-002',
    slug: 'structured-linen-resort-shirt',
    name: 'Structured European Linen Resort Shirt',
    price: 3299,
    original_price: 4999,
    rating: 4.9,
    reviews_count: 98,
    badge: 'NEW',
    is_new_arrival: true,
    category: 'Shirts',
    brand: 'ROYAL OAK',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Olive Tan', hex: '#556B2F' },
      { name: 'Sky Blue', hex: '#87CEEB' }
    ],
    sizes: ['M', 'L', 'XL', 'XXL']
  },
  {
    id: 'prod-003',
    slug: 'japanese-selvedge-tapered-denim',
    name: '14oz Japanese Selvedge Slim Tapered Denim',
    price: 4499,
    original_price: 6999,
    rating: 4.7,
    reviews_count: 86,
    badge: 'TRENDING',
    is_bestseller: true,
    category: 'Denim',
    brand: 'ORDERLY DENIM',
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542272604-780c36856842?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Indigo Raw', hex: '#1F2937' }
    ],
    sizes: ['30', '32', '34', '36']
  },
  {
    id: 'prod-005',
    slug: 'wool-blend-double-breasted-blazer',
    name: 'Italian Merino Wool Double-Breasted Blazer',
    price: 8999,
    original_price: 12999,
    rating: 4.95,
    reviews_count: 64,
    badge: 'LUXURY',
    is_new_arrival: true,
    category: 'Blazers',
    brand: 'ROYAL OAK',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Midnight Navy', hex: '#0A192F' }
    ],
    sizes: ['38R', '40R', '42R', '44R']
  },
  {
    id: 'prod-006',
    slug: 'pleated-tailored-trousers',
    name: 'Single-Pleated Tailored Smart Trousers',
    price: 2799,
    original_price: 3999,
    rating: 4.75,
    reviews_count: 78,
    badge: 'POPULAR',
    is_bestseller: true,
    category: 'Trousers',
    brand: 'ORDERLY STUDIO',
    images: [
      'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Charcoal Grey', hex: '#333333' }
    ],
    sizes: ['30', '32', '34', '36']
  }
];

const TrendingArrivalsSection = ({ title, subtitle }) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('bestsellers'); // 'bestsellers' | 'new_arrivals'

  const loadData = async () => {
    try {
      const [prodRes, settRes] = await Promise.allSettled([
        getProducts(),
        getSettings()
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value?.success && Array.isArray(prodRes.value.data) && prodRes.value.data.length > 0) {
        const sanitized = prodRes.value.data.map((prod) => {
          const rawImg = prod.image || (Array.isArray(prod.images) && prod.images[0]);
          const validImg = (rawImg && typeof rawImg === 'string' && rawImg.length > 10)
            ? rawImg
            : '';
          return {
            ...prod,
            image: validImg
          };
        });
        setProducts(sanitized);
      } else {
        setProducts(DEFAULT_PRODUCTS);
      }

      if (settRes.status === 'fulfilled' && settRes.value?.success && settRes.value.data) {
        setSettings(settRes.value.data);
      }
    } catch {
      setProducts(DEFAULT_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdated = () => loadData();
    window.addEventListener('orderly_products_updated', handleUpdated);
    window.addEventListener('orderly_homepage_sections_updated', handleUpdated);
    window.addEventListener('orderly_site_settings_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('orderly_products_updated', handleUpdated);
      window.removeEventListener('orderly_homepage_sections_updated', handleUpdated);
      window.removeEventListener('orderly_site_settings_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, []);

  const config = settings?.trending_arrivals_config || settings?.best_sellers_config || {};
  const selectedBsIds = Array.isArray(config.selectedBestsellers) 
    ? config.selectedBestsellers 
    : (Array.isArray(config.selectedProducts) ? config.selectedProducts : []);
  const selectedNaIds = Array.isArray(config.selectedNewArrivals) 
    ? config.selectedNewArrivals 
    : [];

  const displayMode = config.displayMode || 'tabs';
  const autoplayDelay = config.autoplayDelay !== undefined ? Number(config.autoplayDelay) : 3500;
  const eyebrowText = config.eyebrow || subtitle || 'TRENDING NOW';
  const mainHeading = config.heading || title || 'BEST SELLING & NEW ARRIVALS';

  // Compute Best Sellers List
  const bestsellerProducts = useMemo(() => {
    if (selectedBsIds.length > 0) {
      const matched = products.filter(p => selectedBsIds.includes(p.id));
      if (matched.length > 0) return matched;
    }
    const flagged = products.filter(p => p.is_bestseller || p.badge === 'BESTSELLER' || p.badge === 'HOT' || p.badge === 'POPULAR');
    return flagged.length > 0 ? flagged : products.slice(0, 8);
  }, [products, selectedBsIds]);

  // Compute New Arrivals List
  const newArrivalProducts = useMemo(() => {
    if (selectedNaIds.length > 0) {
      const matched = products.filter(p => selectedNaIds.includes(p.id));
      if (matched.length > 0) return matched;
    }
    const flagged = products.filter(p => p.is_new_arrival || p.badge === 'NEW' || p.badge === 'NEW ARRIVAL');
    return flagged.length > 0 ? flagged : (products.length > 4 ? products.slice(3, 11) : products);
  }, [products, selectedNaIds]);

  // Helper to render an Auto Carousel
  const renderProductCarousel = (items, carouselKey) => {
    if (!items || items.length === 0) {
      return (
        <div className="trending-empty-state text-center py-5">
          <p className="text-muted mb-3">No products available in this section currently.</p>
          <Link to="/shop" className="btn btn-outline-light btn-sm px-4">
            BROWSE SHOP CATALOG
          </Link>
        </div>
      );
    }

    return (
      <div className="trending-carousel-wrapper position-relative">
        {/* Desktop Navigation Chevrons */}
        <button 
          type="button" 
          className={`trending-nav-btn trending-nav-prev trending-prev-${carouselKey}`}
          aria-label="Previous Products"
        >
          <FiChevronLeft />
        </button>
        <button 
          type="button" 
          className={`trending-nav-btn trending-nav-next trending-next-${carouselKey}`}
          aria-label="Next Products"
        >
          <FiChevronRight />
        </button>

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation={{
            prevEl: `.trending-prev-${carouselKey}`,
            nextEl: `.trending-next-${carouselKey}`
          }}
          pagination={{
            clickable: true,
            el: `.trending-pagination-${carouselKey}`
          }}
          autoplay={autoplayDelay > 0 ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          } : false}
          loop={items.length > 5}
          spaceBetween={20}
          slidesPerView={5}
          breakpoints={{
            320: { slidesPerView: 2, spaceBetween: 12 },
            640: { slidesPerView: 2.5, spaceBetween: 14 },
            768: { slidesPerView: 3, spaceBetween: 16 },
            1024: { slidesPerView: 4, spaceBetween: 18 },
            1280: { slidesPerView: 5, spaceBetween: 20 }
          }}
          className="trending-products-swiper"
        >
          {items.map((product) => (
            <SwiperSlide key={product.id} className="trending-swiper-slide">
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Swiper Pagination Bullets */}
        <div className={`trending-pagination trending-pagination-${carouselKey}`} />
      </div>
    );
  };

  return (
    <section className="trending-arrivals-section py-5">
      <div className="container-fluid px-lg-5">
        {/* Header Row with Eyebrow, Heading, Tab Pills, and View All Link */}
        <div className="d-flex align-items-end justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <span className="trending-eyebrow-red">
              {eyebrowText}
            </span>
            <h2 className="trending-main-heading">
              {mainHeading}
            </h2>
          </div>

          {/* Interactive Tabs Switcher for Tabs Mode */}
          {displayMode === 'tabs' && (
            <div className="trending-tabs-pills d-inline-flex align-items-center">
              <button 
                type="button" 
                className={`trending-tab-btn ${activeTab === 'bestsellers' ? 'active' : ''}`}
                onClick={() => setActiveTab('bestsellers')}
              >
                <FiZap className="me-1 tab-icon" /> BEST SELLERS ({bestsellerProducts.length})
              </button>
              <button 
                type="button" 
                className={`trending-tab-btn ${activeTab === 'new_arrivals' ? 'active' : ''}`}
                onClick={() => setActiveTab('new_arrivals')}
              >
                <FiPlus className="me-1 tab-icon" /> NEW ARRIVALS ({newArrivalProducts.length})
              </button>
            </div>
          )}

          <Link to="/shop" className="view-all-products-link">
            VIEW ALL PRODUCTS <FiArrowRight className="ms-1" />
          </Link>
        </div>

        {/* Content Area: Carousel or Skeleton */}
        {loading ? (
          <HomeTrendingSkeleton />
        ) : (
          <>
            {displayMode === 'stacked' ? (
              <div className="stacked-carousels-container d-flex flex-column gap-5">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="badge bg-danger text-white px-2 py-1">BEST SELLERS</span>
                    <h3 className="fs-5 text-white fw-bold mb-0">Customer Favorites & Trending Outfits</h3>
                  </div>
                  {renderProductCarousel(bestsellerProducts, 'bs-stacked')}
                </div>

                <div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="badge bg-light text-dark px-2 py-1">NEW ARRIVALS</span>
                    <h3 className="fs-5 text-white fw-bold mb-0">Fresh Drops & Latest Runway Fits</h3>
                  </div>
                  {renderProductCarousel(newArrivalProducts, 'na-stacked')}
                </div>
              </div>
            ) : (
              <div className="tabbed-carousel-container">
                {activeTab === 'bestsellers' 
                  ? renderProductCarousel(bestsellerProducts, 'bs-tab') 
                  : renderProductCarousel(newArrivalProducts, 'na-tab')}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default TrendingArrivalsSection;
