import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { FiAward, FiShield, FiTrendingUp, FiCheckCircle, FiUsers, FiClock, FiMapPin } from 'react-icons/fi';
import { getSettings } from '../services/api';
import './AboutUs.css';

const AboutUs = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const res = await getSettings();
      if (active && res?.success) setSettings(res.data);
    };
    load();

    const onSync = () => load();
    window.addEventListener('orderly_settings_updated', onSync);
    window.addEventListener('storage', onSync);
    return () => { 
      active = false; 
      window.removeEventListener('orderly_settings_updated', onSync); 
      window.removeEventListener('storage', onSync); 
    };
  }, []);

  return (
    <>
      <SEO title="About Our Atelier | ORDERLY Menswear" />
      <main className="orderly-about-page py-5">
        {/* Animated Hero Header */}
        <section className="about-hero-section container-fluid px-lg-5 mb-5 text-center fade-in-up">
          <span className="about-eyebrow-badge">
            {settings?.about_us_subtitle || 'HERITAGE, PRECISION & CRAFTSMANSHIP'}
          </span>
          <h1 className="about-hero-title display-4 fw-extrabold text-white mt-2">
            {settings?.about_us_heading || 'Redefining Modern Luxury Menswear'}
          </h1>
          <p className="about-hero-subtitle lead text-muted max-w-700 mx-auto mt-3">
            Born out of a relentless passion for Italian tailoring, selvedge raw denim, and bespoke silhouettes designed for gentlemen who refuse ordinary.
          </p>
        </section>

        {/* Story Section with Floating Image Card */}
        <section className="container-fluid px-lg-5 mb-5">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6 fade-in-left">
              <div className="about-image-card-wrapper position-relative">
                <img
                  src={settings?.about_us_image || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'}
                  alt="ORDERLY Atelier Studio"
                  className="about-main-img img-fluid rounded-4 shadow-2xl"
                />
                <div className="about-img-overlay-card glass-panel">
                  <FiAward className="text-warning fs-1 mb-2" />
                  <h5 className="text-white fw-bold mb-1">100% Handcrafted</h5>
                  <span className="text-muted extra-small">Pure Italian Fabrics & Bespoke Tailoring</span>
                </div>
              </div>
            </div>

            <div className="col-lg-6 fade-in-right">
              <span className="text-warning fw-bold text-uppercase letter-spacing-2 small">THE ATELIER STORY</span>
              <h2 className="text-white fw-extrabold fs-1 mt-1 mb-4">
                {settings?.about_us_title || 'Craftsmanship Without Compromise'}
              </h2>
              <p className="about-body-p lead text-muted mb-4">
                {settings?.about_us_text_1 || 'At ORDERLY, we believe that true luxury lies in the details — from the single-needle stitching on our 100% European linen shirts to the custom horn buttons on our double-breasted blazers.'}
              </p>
              <p className="about-body-p text-muted mb-4">
                {settings?.about_us_text_2 || 'Every piece in our collection undergoes a rigorous 14-point quality inspection. We source raw materials directly from heritage mills in Italy and Japan, delivering timeless apparel engineered for perfection.'}
              </p>

              <div className="row g-3 mt-2">
                <div className="col-6">
                  <div className="ethos-mini-card">
                    <FiShield className="text-danger fs-3 mb-2" />
                    <h6 className="text-white fw-bold mb-0">Heritage Quality</h6>
                    <span className="text-muted extra-small">Zero synthetic blends</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="ethos-mini-card">
                    <FiTrendingUp className="text-warning fs-3 mb-2" />
                    <h6 className="text-white fw-bold mb-0">Modern Fit</h6>
                    <span className="text-muted extra-small">Engineered precision fit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animated Counter Stats Section */}
        <section className="about-stats-section py-5 bg-dark-surface my-5 border-top border-bottom border-secondary fade-in-up">
          <div className="container-fluid px-lg-5">
            <div className="row g-4 text-center">
              <div className="col-6 col-md-3">
                <div className="stat-box">
                  <h2 className="stat-number text-warning">50,000+</h2>
                  <span className="stat-label text-muted">Gentlemen Dressed</span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="stat-box">
                  <h2 className="stat-number text-danger">100%</h2>
                  <span className="stat-label text-muted">Pure Natural Fabrics</span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="stat-box">
                  <h2 className="stat-number text-white">14</h2>
                  <span className="stat-label text-muted">Point Quality Inspection</span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="stat-box">
                  <h2 className="stat-number text-success">4.9 ★</h2>
                  <span className="stat-label text-muted">Customer Rating</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutUs;
