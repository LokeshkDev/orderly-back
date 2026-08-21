import React, { useState, useEffect, useRef } from 'react';
import './PageLoader.css';

const MIN_DISPLAY_MS = 900;
const FADE_OUT_MS = 300;

const PageLoader = () => {
  // Only display on the very first time entering the website in this session
  const [shouldShow] = useState(() => {
    try {
      const alreadyShown = sessionStorage.getItem('orderly_initial_loader_shown');
      if (alreadyShown) return false;
      sessionStorage.setItem('orderly_initial_loader_shown', 'true');
      return true;
    } catch (e) {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(shouldShow);
  const [isLeaving, setIsLeaving] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!shouldShow) return;

    timersRef.current.push(
      setTimeout(() => {
        setIsLeaving(true);
      }, MIN_DISPLAY_MS)
    );

    timersRef.current.push(
      setTimeout(() => {
        setIsLoading(false);
      }, MIN_DISPLAY_MS + FADE_OUT_MS)
    );

    return () => timersRef.current.forEach(clearTimeout);
  }, [shouldShow]);

  if (!shouldShow || !isLoading) return null;

  return (
    <div className={`page-loader-overlay ${isLeaving ? 'page-loader-leaving' : ''}`} aria-hidden="true">
      <div className="page-loader-inner">
        <div className="page-loader-logo" aria-hidden="true">
          <div className="loader-ring" />
          <div className="loader-ring" />
          <div className="loader-ring" />
        </div>
        <span className="page-loader-text">ORDERLY</span>
      </div>
    </div>
  );
};

export default PageLoader;