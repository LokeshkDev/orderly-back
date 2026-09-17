import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiX } from 'react-icons/fi';
import logoImg from '../../assets/logo/logo.png';
import SearchAutoSuggestDropdown from './SearchAutoSuggestDropdown';

const MobileHeader = ({ onOpenMenu }) => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

        {/* Right: Search */}
        <div className="mobile-header-right">
          <button 
            type="button" 
            className="mobile-header-icon-btn"
            onClick={() => setIsSearchOpen(prev => !prev)}
            aria-label="Search"
          >
            <FiSearch />
          </button>
        </div>
      </header>

      {/* Expandable Search Input Bar with Auto-Suggest */}
      {isSearchOpen && (
        <div className="p-2 bg-dark border-bottom border-secondary mobile-only position-relative z-3">
          <div className="position-relative">
            <form onSubmit={handleSearchSubmit} className="d-flex align-items-center gap-2 px-2">
              <input 
                type="text" 
                className="form-control form-control-sm bg-black text-white border-secondary"
                placeholder="Search products, combos..."
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
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              >
                <FiX />
              </button>
            </form>

            {/* Auto-Suggest Dropdown for Mobile */}
            <SearchAutoSuggestDropdown
              searchQuery={searchQuery}
              isOpen={isSearchOpen}
              onSelect={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              onClose={() => setIsSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
