import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import ProductCard from '../product/ProductCard';
import { getProducts } from '../../services/api';

const DEFAULT_MOBILE_PRODUCTS = [
  {
    id: 'prod-001',
    slug: 'essential-cotton-crewneck',
    name: 'Essential Heavyweight Cotton Crewneck Tee',
    price: 1499,
    original_price: 2499,
    rating: 4.8,
    reviews_count: 142,
    badge: 'BESTSELLER',
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

const MobileProductGrid = () => {
  const [products, setProducts] = useState(DEFAULT_MOBILE_PRODUCTS);

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
