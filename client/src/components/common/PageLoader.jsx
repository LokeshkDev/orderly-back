import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logoLoader from '../../assets/logo-loader.gif';
import './PageLoader.css';

const MIN_DISPLAY_MS = 500;

const PageLoader = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div className="page-loader-overlay" aria-hidden="true">
      <div className="page-loader-inner">
        <img src={logoLoader} alt="ORDERLY" className="page-loader-gif" />
        <span className="page-loader-text">ORDERLY</span>
      </div>
    </div>
  );
};

export default PageLoader;