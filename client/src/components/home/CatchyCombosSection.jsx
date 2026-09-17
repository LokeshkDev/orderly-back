import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FiShoppingBag, FiArrowRight, FiZap, FiChevronLeft, FiChevronRight, FiCheck, FiGrid } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { getCombos } from '../../services/api';
import { CatchyCombosSkeleton } from '../common/Skeleton';
import ComboCover from '../common/ComboCover';
import { formatPrice } from '../../utils/formatters';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './CatchyCombosSection.css';

const DEFAULT_CATCHY_COMBOS = [
  {
    id: 'combo-001',
    name: 'Resort Linen & Selvedge Denim 2-Piece Bundle',
    badge: 'SAVE ₹2,299',
    pieces_count: 2,
    original_price: 7798,
    offer_price: 5499,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
    items: [
      { name: 'European Linen Resort Shirt', category: 'Shirts' },
      { name: 'Japanese Selvedge Raw Denim', category: 'Denim' }
    ]
  },
  {
    id: 'combo-002',
    name: 'Executive 3-Piece Italian Suit & Polo Box',
    badge: 'LUXURY BUNDLE',
    pieces_count: 3,
    original_price: 13997,
    offer_price: 9999,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
    items: [
      { name: 'Italian Merino Wool Blazer', category: 'Blazers' },
      { name: 'European Linen Resort Shirt', category: 'Shirts' },
      { name: 'Essential Cotton Crewneck Tee', category: 'Tops & T-Shirts' }
    ]
  },
  {
    id: 'combo-003',
    name: 'Streetwear Graphic Tee & Selvedge Set',
    badge: 'HOT BUNDLE DEAL',
    pieces_count: 2,
    original_price: 6998,
    offer_price: 4999,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop',
    items: [
      { name: 'Acid Wash Oversized Graphic Tee', category: 'Tops & T-Shirts' },
      { name: '14oz Japanese Selvedge Denim', category: 'Denim' }
    ]
  }
];

const CatchyCombosSection = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [combos, setCombos] = useState([]);
  const [addingComboId, setAddingComboId] = useState(null);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await getCombos();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCombos(res.data.filter(c => c.status !== 'Inactive'));
        } else {
          setCombos(DEFAULT_CATCHY_COMBOS);
        }
      } catch (e) {
        setCombos(DEFAULT_CATCHY_COMBOS);
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const handleClaimCombo = (combo, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAddingComboId(combo.id);
    addToCart({
      id: combo.id,
      name: combo.name,
      price: combo.offer_price || combo.price,
      originalPrice: combo.original_price,
      image: combo.cover_image || combo.image || combo.images?.[0],
      quantity: 1,
      selectedColor: 'Standard Bundle',
      selectedSize: 'L',
      isCombo: true
    });
    setTimeout(() => {
      setAddingComboId(null);
    }, 1500);
  };

  return (
    <section className="catchy-combos-section py-5">
      <div className="container-fluid px-lg-5">
        {/* Header Title */}
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4 text-center text-md-start">
          <div>
            <span className="combo-section-subtitle">
              <FiZap className="text-warning me-1" /> {subtitle || 'EXCLUSIVE MULTI-PIECE BUNDLE SAVINGS'}
            </span>
            <h2 className="combo-section-title">
              {title || 'Catchy Combo Bundles & Curated Sets'}
            </h2>
          </div>
          <button 
            type="button" 
            className="btn-explore-all-combos mt-3 mt-md-0"
            onClick={() => navigate('/combos')}
          >
            Explore All Bundles <FiArrowRight />
          </button>
        </div>

        {/* Catchy Cards Swiper Carousel matching Trending Now breakpoints & card size */}
        {loading ? (
          <CatchyCombosSkeleton />
        ) : (
          <div className="trending-carousel-wrapper position-relative">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={5}
              breakpoints={{
                320: { slidesPerView: 2, spaceBetween: 12 },
                640: { slidesPerView: 2.5, spaceBetween: 14 },
                768: { slidesPerView: 3, spaceBetween: 16 },
                1024: { slidesPerView: 4, spaceBetween: 18 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }}
              autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              pagination={{ clickable: true, el: '.catchy-combo-pagination' }}
              className="catchy-combos-swiper trending-products-swiper"
            >
              {combos.map((combo) => {
                const savings = Math.max(0, (combo.original_price || 0) - (combo.offer_price || combo.price || 0));
                const discountPct = combo.original_price > 0 ? Math.round((savings / combo.original_price) * 100) : 0;
                const isAdding = addingComboId === combo.id;

                return (
                  <SwiperSlide key={combo.id} className="trending-swiper-slide">
                    <div 
                      className="product-card catchy-combo-card"
                      onClick={() => navigate(`/combo/${combo.slug || combo.id}`)}
                    >
                      {/* Media Header Container with 3:4 Aspect Ratio */}
                      <div className="product-card-media">
                        <Link to={`/combo/${combo.slug || combo.id}`} className="product-image-link">
                          <ComboCover 
                            items={combo.items} 
                            images={combo.images} 
                            coverImage={combo.cover_image}
                            comboName={combo.name}
                          />
                        </Link>

                        {/* Top-Left Red Badge on Image */}
                        <div className="card-badges-stack">
                          <span className="card-top-badge badge-red-tag">
                            {combo.badge ? combo.badge : discountPct > 0 ? `SAVE ${discountPct}%` : 'COMBO'}
                          </span>
                        </div>
                      </div>

                      {/* Card Content Info matching reference screenshot */}
                      <div className="combo-card-info-body">
                        {/* 1. Category Eyebrow Tag in RED */}
                        <div className="combo-card-category-eyebrow">
                          {(combo.category || 'COLLEGE COMBO').toUpperCase()}
                        </div>

                        {/* 2. Combo Title */}
                        <h5 className="combo-card-title-wrap">
                          <Link to={`/combo/${combo.slug || combo.id}`} className="combo-card-title-link">
                            <span className="combo-card-title-text">{combo.name}</span>
                          </Link>
                        </h5>

                        {/* 3. Items Set Tag */}
                        <div className="combo-card-items-tag">
                          <FiGrid className="combo-card-items-icon" />
                          <span>{combo.pieces_count || combo.items?.length || 2} Items Set</span>
                        </div>

                        {/* 4. Price Row with Red Offer Price & Grey Old Price */}
                        <div className="combo-card-price-row">
                          <span className="combo-offer-price-red">{formatPrice(combo.offer_price || combo.price || 0)}</span>
                          {combo.original_price && Number(combo.original_price) > Number(combo.offer_price || combo.price || 0) && (
                            <span className="combo-original-price-grey">{formatPrice(combo.original_price)}</span>
                          )}
                        </div>

                        {/* 5. Action Row - VIEW COMBO CTA Button */}
                        <div className="combo-card-action-row mt-auto" onClick={(e) => e.stopPropagation()}>
                          <Link 
                            to={`/combo/${combo.slug || combo.id}`} 
                            className="btn-view-combo-cta"
                          >
                            VIEW COMBO
                          </Link>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            <div className="catchy-combo-pagination d-flex justify-content-center gap-2 mt-4" />
          </div>
        )}
      </div>
    </section>
  );
};

export default CatchyCombosSection;
