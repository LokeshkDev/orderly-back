import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import ProductCard from '../components/product/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';

const Wishlist = () => {
  const { wishlist } = useWishlist();

  return (
    <>
      <SEO title="My Saved Wishlist | ORDERLY Mens Wear" />

      <div className="orderly-wishlist-page section-padding">
        <div className="container">
          <div className="section-title-wrapper text-center">
            <span className="section-subtitle">Saved Favorites</span>
            <h1 className="section-title">Your Luxury Wishlist ({wishlist.length})</h1>
          </div>

          {wishlist.length === 0 ? (
            <div className="glass-panel text-center py-5 px-4 mx-auto" style={{ maxWidth: '560px' }}>
              <FiHeart className="fs-1 text-accent-red mb-3" />
              <h3>Your Wishlist is Empty</h3>
              <p className="text-muted">Save items you love by tapping the heart icon on any product card.</p>
              <Link to="/" className="btn-primary-orderly mt-3">
                <FiShoppingBag /> Back to Home
              </Link>
            </div>
          ) : (
            <div className="row g-4">
              {wishlist.map(product => (
                <div key={product.id} className="col-lg-3 col-md-4 col-6">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;
