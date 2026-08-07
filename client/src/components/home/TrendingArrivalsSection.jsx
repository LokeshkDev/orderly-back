import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import ProductCard from '../product/ProductCard';
import { getProducts } from '../../services/api';
import './TrendingArrivalsSection.css';

const TrendingArrivalsSection = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [products, setProducts] = useState([]);

  // Fetch products from the DB (Admin-managed), so edits reflect live on the homepage.
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await getProducts();
        if (res && res.success && Array.isArray(res.data)) {
          setProducts(res.data);
        }
      } catch (err) {
        console.warn('Failed to load products for trending section:', err.message);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const all = products;
    if (activeTab === 'TRENDING') {
      return all.filter(p => p.badge === 'TRENDING' || p.badge === 'HOT');
    }
    if (activeTab === 'NEW') {
      return all.filter(p => p.badge === 'NEW' || p.badge === 'LUXURY');
    }
    if (activeTab === 'BESTSELLER') {
      return all.filter(p => p.badge === 'BESTSELLER' || p.badge === 'POPULAR');
    }
    return all; // ALL
  }, [activeTab, products]);

  return (
    <section className="trending-arrivals-section my-5 py-4">
      <div className="container-fluid px-lg-5">
        <div className="text-center mb-4">
          <span className="trending-section-subtitle">{subtitle || 'HANDPICKED CURATION'}</span>
          <h2 className="trending-section-title">{title || 'Trending & New Arrivals'}</h2>
        </div>

        {/* Tab Filters */}
        <div className="trending-tabs-row d-flex align-items-center justify-content-center flex-wrap gap-2 mb-4">
          <button 
            className={`trending-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            ALL COLLECTION
          </button>
          <button 
            className={`trending-tab-btn ${activeTab === 'TRENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('TRENDING')}
          >
            TRENDING NOW
          </button>
          <button 
            className={`trending-tab-btn ${activeTab === 'NEW' ? 'active' : ''}`}
            onClick={() => setActiveTab('NEW')}
          >
            NEW ARRIVALS
          </button>
          <button 
            className={`trending-tab-btn ${activeTab === 'BESTSELLER' ? 'active' : ''}`}
            onClick={() => setActiveTab('BESTSELLER')}
          >
            BESTSELLERS
          </button>
        </div>

        {/* Products Grid */}
        <div className="row g-3 g-md-4 mb-4">
          {filteredProducts.slice(0, 8).map(product => (
            <div key={product.id} className="col-6 col-md-4 col-lg-3">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-4">
          <button className="btn-primary-orderly btn-lg" onClick={() => navigate('/shop')}>
            VIEW FULL CATALOG <FiArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TrendingArrivalsSection;
