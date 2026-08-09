import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import ProductCard from '../product/ProductCard';
import { getProducts } from '../../services/api';

const DEFAULT_MOBILE_PRODUCTS = [
  {
    id: 1,
    name: 'Black Premium Shirt',
    price: 999,
    original_price: 1599,
    rating: 5,
    reviews_count: 128,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop',
    badge: 'BESTSELLER'
  },
  {
    id: 2,
    name: 'White Textured Shirt',
    price: 899,
    original_price: 1499,
    rating: 5,
    reviews_count: 86,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
    badge: 'TRENDING'
  },
  {
    id: 3,
    name: 'Navy Blue Polo T-Shirt',
    price: 699,
    original_price: 1199,
    rating: 5,
    reviews_count: 76,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop',
    badge: 'NEW'
  },
  {
    id: 4,
    name: 'Cargo Pants - Olive',
    price: 1199,
    original_price: 1899,
    rating: 5,
    reviews_count: 54,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Denim Jacket',
    price: 1299,
    original_price: 2199,
    rating: 5,
    reviews_count: 94,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
    badge: 'POPULAR'
  }
];

const FALLBACK_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'
];

const MobileProductGrid = () => {
  const [products, setProducts] = useState(DEFAULT_MOBILE_PRODUCTS);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await getProducts();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const sanitized = res.data.map((prod, idx) => {
            const rawImg = prod.image || (Array.isArray(prod.images) && prod.images[0]);
            const validImg = (rawImg && typeof rawImg === 'string' && rawImg.length > 10)
              ? rawImg
              : FALLBACK_PRODUCT_IMAGES[idx % FALLBACK_PRODUCT_IMAGES.length];
            return {
              ...prod,
              image: validImg
            };
          });
          setProducts(sanitized);
        } else {
          setProducts(DEFAULT_MOBILE_PRODUCTS);
        }
      } catch (err) {
        setProducts(DEFAULT_MOBILE_PRODUCTS);
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
    <section className="mobile-only py-3">
      {/* Header */}
      <div className="d-flex align-items-end justify-content-between px-3 mb-3">
        <div>
          <span className="mobile-section-eyebrow">TRENDING NOW</span>
          <h2 className="mobile-section-title">BEST SELLING PRODUCTS</h2>
        </div>

        <Link to="/shop" className="text-danger fw-bold small text-decoration-none d-flex align-items-center gap-1">
          VIEW ALL <FiArrowRight />
        </Link>
      </div>

      {/* 2 Column App Product Grid */}
      <div className="mobile-product-grid">
        {products.slice(0, 5).map((product) => (
          <div key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default MobileProductGrid;
