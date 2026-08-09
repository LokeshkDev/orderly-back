import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiUser, FiHeart, FiShoppingBag, FiX } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import logoImg from '../../assets/logo/logo.jpeg';

const MobileHeader = ({ onOpenMenu }) => {
  const navigate = useNavigate();
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const wishlistCount = wishlist ? wishlist.length : 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="mobile-app-header mobile-only">
        {/* Left: Hamburger Drawer Trigger */}
        <div className="mobile-header-left">
          <button 
            type="button" 
            className="mobile-header-icon-btn" 
            onClick={onOpenMenu}
            aria-label="Open Navigation Menu"
          >
            <FiMenu />
          </button>
        </div>

        {/* Center: ORDERLY Brand Logo */}
        <div className="mobile-header-center">
          <Link to="/">
            <img src={logoImg} alt="ORDERLY" className="mobile-header-logo" />
          </Link>
        </div>

        {/* Right: Search and Account icon only */}
        <div className="mobile-header-right">
          <button 
            type="button" 
            className="mobile-header-icon-btn"
            onClick={() => setIsSearchOpen(prev => !prev)}
            aria-label="Search"
          >
            <FiSearch />
          </button>

          <Link to="/login" className="mobile-header-icon-btn" aria-label="Account">
            <FiUser />
          </Link>
        </div>
      </header>

      {/* Expandable Search Input Bar */}
      {isSearchOpen && (
        <div className="p-2 bg-dark border-bottom border-secondary mobile-only position-relative z-3">
          <form onSubmit={handleSearchSubmit} className="d-flex align-items-center gap-2 px-2">
            <input 
              type="text" 
              className="form-control form-control-sm bg-black text-white border-secondary"
              placeholder="Search shirts, tees, denim, suits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button 
              type="submit" 
              className="btn btn-sm btn-danger px-3"
              aria-label="Submit Search"
            >
              <FiSearch />
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-light" 
              onClick={() => setIsSearchOpen(false)}
            >
              <FiX />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
