import React from 'react';
import { FiTruck, FiRotateCcw, FiShield, FiHeadphones } from 'react-icons/fi';
import './TrustFeaturesStrip.css';

const TrustFeaturesStrip = () => {
  return (
    <section className="hero-trust-features-strip desktop-only">
      <div className="container-fluid px-lg-5">
        <div className="trust-features-grid">
          <div className="trust-feature-item">
            <div className="trust-icon-box">
              <FiTruck className="trust-icon-red" />
            </div>
            <div className="trust-text-box">
              <h4 className="trust-item-title">FREE SHIPPING</h4>
              <p className="trust-item-sub">On orders above ₹1499</p>
            </div>
          </div>

          <div className="trust-feature-item">
            <div className="trust-icon-box">
              <FiRotateCcw className="trust-icon-red" />
            </div>
            <div className="trust-text-box">
              <h4 className="trust-item-title">EASY RETURNS</h4>
              <p className="trust-item-sub">Within 7 days</p>
            </div>
          </div>

          <div className="trust-feature-item">
            <div className="trust-icon-box">
              <FiShield className="trust-icon-red" />
            </div>
            <div className="trust-text-box">
              <h4 className="trust-item-title">PREMIUM QUALITY</h4>
              <p className="trust-item-sub">100% Original Products</p>
            </div>
          </div>

          <div className="trust-feature-item">
            <div className="trust-icon-box">
              <FiHeadphones className="trust-icon-red" />
            </div>
            <div className="trust-text-box">
              <h4 className="trust-item-title">24/7 SUPPORT</h4>
              <p className="trust-item-sub">We're here to help</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustFeaturesStrip;
