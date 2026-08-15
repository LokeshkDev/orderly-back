import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import ProductCard from '../product/ProductCard';
import { getProducts } from '../../services/api';
import './TrendingArrivalsSection.css';

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Italian Flax Linen Shirt',
    price: 1499,
    original_price: 2499,
    rating: 5,
    reviews_count: 128,
    image: '',
    badge: 'BESTSELLER'
  },
  {
    id: 2,
    name: 'Italian Merino Wool Blazer',
    price: 8999,
    original_price: 12999,
    rating: 5,
    reviews_count: 94,
    image: '',
    badge: 'LUXURY'
  },
  {
    id: 3,
    name: 'Velvet Evening Tuxedo Suit',
    price: 9499,
    original_price: 13999,
    rating: 5,
    reviews_count: 86,
    image: '',
    badge: 'EXCLUSIVE'
  },
  {
    id: 4,
    name: 'Selvedge Stretch Denim Pants',
    price: 2999,
    original_price: 4299,
    rating: 5,
    reviews_count: 112,
    image: '',
    badge: 'TRENDING'
  },
  {
    id: 5,
    name: 'Essential Heavyweight Tee',
    price: 999,
    original_price: 1599,
    rating: 5,
    reviews_count: 142,
    image: '',
    badge: 'NEW'
  }
];

const TrendingArrivalsSection = ({ title, subtitle }) => {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await getProducts();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const sanitized = res.data.map((prod) => {
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
      } catch (err) {
        setProducts(DEFAULT_PRODUCTS);
      }
    };
    loadProducts();

    window.addEventListener('orderly_products_updated', loadProducts);
    window.addEventListener('storage', loadProducts);
    return () => {
      window.removeEventListener('orderly_products_updated', loadProducts);
      window.removeEventListener('storage', loadProducts);
    };
  }, []);

  return (
    <section className="trending-arrivals-section py-5">
      <div className="container-fluid px-lg-5">
        {/* Header Row */}
        <div className="d-flex align-items-end justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <span className="trending-eyebrow-red">
              {subtitle || 'TRENDING NOW'}
            </span>
            <h2 className="trending-main-heading">
              {title || 'BEST SELLING PRODUCTS'}
            </h2>
          </div>

          <Link to="/shop" className="view-all-products-link">
            VIEW ALL PRODUCTS <FiArrowRight className="ms-1" />
          </Link>
        </div>

        {/* 5-Column Product Grid */}
        <div className="trending-products-grid">
          {products.slice(0, 5).map((product) => (
            <div key={product.id} className="trending-grid-col">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingArrivalsSection;
