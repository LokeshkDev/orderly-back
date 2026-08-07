import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FiShoppingBag, FiArrowRight, FiPercent, FiCheck, FiChevronLeft, FiChevronRight, FiGrid, FiZap } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './CatchyCombosSection.css';

const DEFAULT_CATCHY_COMBOS = [
  {
    id: 'combo-1',
    name: 'Resort Linen & Selvedge Denim 2-Piece Bundle',
    badge: 'SAVE 35% OFF',
    pieces_count: 2,
    original_price: 6999,
    offer_price: 4499,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
    items: [
      { name: 'European Linen Resort Shirt', category: 'Shirts' },
      { name: 'Japanese Selvedge Raw Denim', category: 'Denim' }
    ]
  },
  {
    id: 2,
    name: 'Monochrome Oversized Tee & Cargo Pants Outfit',
    badge: 'HOT BUNDLE DEAL',
    pieces_count: 2,
    original_price: 5499,
    offer_price: 3699,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop',
    items: [
      { name: 'Heavyweight Heavy Cotton Tee', category: 'Tees' },
      { name: 'Tactical Multi-Pocket Cargo', category: 'Trousers' }
    ]
  },
  {
    id: 3,
    name: 'Italian Tailored Blazer & Chino 3-Piece Gentleman Set',
    badge: 'PREMIUM SUIT DEAL',
    pieces_count: 3,
    original_price: 12999,
    offer_price: 8499,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    items: [
      { name: 'Italian Double-Breasted Blazer', category: 'Blazers' },
      { name: 'Structured Linen Oxford Shirt', category: 'Shirts' },
      { name: 'Tailored Slim Chino Trousers', category: 'Trousers' }
    ]
  }
];

const CatchyCombosSection = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [combos, setCombos] = useState(DEFAULT_CATCHY_COMBOS);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/combos`);
        if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCombos(res.data.data.filter(c => c.status !== 'Inactive'));
        }
      } catch (e) {}
    };
    fetchCombos();
  }, []);

  const handleClaimCombo = (combo, e) => {
    e.stopPropagation();
    addToCart({
      id: combo.id,
      name: combo.name,
      price: combo.offer_price || combo.price,
      originalPrice: combo.original_price,
      image: combo.image || combo.images?.[0],
      quantity: 1,
      selectedColor: 'Standard Bundle',
      selectedSize: 'L',
      isCombo: true
    });
    toast.success(`Bundle Deal "${combo.name}" added to your Bag!`);
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

        {/* Catchy Cards Swiper Carousel */}
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 20 },
            992: { slidesPerView: 3, spaceBetween: 24 }
          }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true, el: '.catchy-combo-pagination' }}
          className="catchy-combos-swiper"
        >
          {combos.map((combo) => {
            const savings = Math.max(0, (combo.original_price || 0) - (combo.offer_price || 0));
            const discountPct = combo.original_price > 0 ? Math.round((savings / combo.original_price) * 100) : 0;

            return (
              <SwiperSlide key={combo.id}>
                <div 
                  className="catchy-combo-card"
                  onClick={() => navigate('/combos')}
                >
                  {/* Card Media Header */}
                  <div className="catchy-combo-media">
                    <img 
                      src={combo.image || combo.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop'} 
                      alt={combo.name} 
                      className="catchy-combo-img"
                    />
                    <div className="catchy-combo-overlay" />

                    {/* Badge Pill Top Right */}
                    <div className="combo-top-badge">
                      <span className="badge-badge-text">
                        <FiPercent className="me-1" /> {combo.badge || `${discountPct}% OFF BUNDLE`}
                      </span>
                    </div>

                    {/* Pieces Count Tag Top Left */}
                    <div className="combo-pieces-tag">
                      <FiGrid className="me-1" /> {combo.pieces_count || combo.items?.length || 2} PIECES INCLUDED
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="catchy-combo-body">
                    <h3 className="catchy-combo-name">{combo.name}</h3>

                    {/* Included Pieces Pills */}
                    {combo.items && combo.items.length > 0 && (
                      <div className="included-pieces-pills">
                        {combo.items.map((it, idx) => (
                          <span key={idx} className="piece-pill-badge">
                            <FiCheck className="me-1 text-warning" /> {it.name || it.pieceLabel}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price & Action Footer */}
                    <div className="catchy-combo-footer">
                      <div>
                        {combo.original_price > 0 && (
                          <span className="combo-msrp-price">₹{Number(combo.original_price).toLocaleString()}</span>
                        )}
                        <div className="combo-deal-price">
                          ₹{Number(combo.offer_price || combo.price).toLocaleString()}
                        </div>
                      </div>

                      <button 
                        type="button" 
                        className="btn-claim-bundle"
                        onClick={(e) => handleClaimCombo(combo, e)}
                        title="Add bundle to bag"
                      >
                        <FiShoppingBag /> Claim Bundle
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        <div className="catchy-combo-pagination d-flex justify-content-center gap-2 mt-4" />
      </div>
    </section>
  );
};

export default CatchyCombosSection;
