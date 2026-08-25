import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import SEOHead from '../components/common/SEOHead';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="notfound-page-wrapper d-flex align-items-center justify-content-center py-5">
      <SEOHead 
        title="404 Page Not Found | ORDERLY Mens Wear" 
        description="The requested page could not be found. Explore our luxury collection of men's shirts, denim, and combos."
        canonicalPath="/404"
        noindex={true}
      />
      <div className="container text-center py-5">
        <div className="notfound-card shadow-lg p-4 p-md-5 rounded-4 mx-auto" style={{ maxWidth: '600px', background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="notfound-badge mb-3">
            <span className="badge bg-danger bg-opacity-20 text-danger px-3 py-2 fs-6 rounded-pill fw-bold">
              404 • PAGE NOT FOUND
            </span>
          </div>

          <h1 className="notfound-title text-white fw-bold display-4 mb-3">
            Lost in <span className="text-danger">Luxury?</span>
          </h1>

          <p className="text-muted fs-6 mb-4">
            The page you are looking for has been moved, renamed, or is currently unavailable. 
            Redirecting to home in <strong className="text-danger">{countdown}</strong> seconds...
          </p>

          {/* Action CTAs */}
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link to="/" className="btn btn-danger px-4 py-3 fw-bold rounded-3 d-flex align-items-center gap-2">
              <FiHome /> Return to Home
            </Link>
            <Link to="/shop" className="btn btn-outline-light px-4 py-3 fw-bold rounded-3 d-flex align-items-center gap-2">
              <FiShoppingBag /> Explore Shop <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
