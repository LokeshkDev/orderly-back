import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { getSettings } from '../services/api';
import { FiShield, FiLock, FiCheckCircle } from 'react-icons/fi';
import './PolicyPages.css';

const PrivacyPolicy = () => {
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

  const pageData = settings?.cms_pages?.privacy || {};
  const bannerImage = pageData.banner_image;
  const title = pageData.title || 'Privacy Policy';
  const subtitle = pageData.subtitle || 'Commitment To Protecting Your Personal Data';
  const contentHtml = pageData.content_html;

  return (
    <>
      <SEO
        title={`${title} | ORDERLY Menswear`}
        description="Read how ORDERLY collects, uses, and protects your personal data and ensures secure transactions."
        canonicalPath="/privacy-policy"
      />
      <div className="orderly-cms-page py-5">
        {bannerImage && (
          <div className="cms-hero-banner-container container-fluid px-lg-5 mb-5">
            <div
              className="cms-hero-banner rounded-4 shadow-2xl"
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,10,0.5), rgba(10,10,10,0.85)), url(${bannerImage})` }}
            >
              <div className="cms-hero-content text-center py-5">
                <span className="badge bg-warning text-dark text-uppercase px-3 py-1 mb-2 font-weight-bold">
                  Data Security & Privacy
                </span>
                <h1 className="display-4 fw-extrabold text-white mt-1 mb-2">{title}</h1>
                <p className="lead text-muted max-w-700 mx-auto mb-0">{subtitle}</p>
              </div>
            </div>
          </div>
        )}

        <div className="container" style={{ maxWidth: '900px' }}>
          {!bannerImage && (
            <div className="text-center mb-5">
              <span className="badge bg-warning text-dark text-uppercase px-3 py-1 mb-2 font-weight-bold">
                Data Security & Privacy
              </span>
              <h1 className="display-5 fw-extrabold text-white mt-1 mb-2">{title}</h1>
              <p className="lead text-muted mb-0">{subtitle}</p>
            </div>
          )}

          <div className="glass-panel p-4 p-md-5 rounded-4 border border-secondary shadow-lg">
            {contentHtml ? (
              <div
                className="cms-rich-html-content"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            ) : (
              <div className="cms-rich-html-content">
                <h2>Your Privacy Matters</h2>
                <p>At ORDERLY, we treat personal data with supreme discretion. This Privacy Policy outlines how your personal information is gathered, utilized, and safeguarded when you visit or transact on orderlymenswear.com.</p>
                <h3>1. Information We Collect</h3>
                <p>When you browse or place an order, we collect essential identifiers including your name, shipping address, contact phone number, email address, and encrypted payment tokenization details.</p>
                <h3>2. How We Use Your Data</h3>
                <ul>
                  <li>To process, dispatch, and track your sartorial orders.</li>
                  <li>To communicate live shipment milestones and transactional notifications.</li>
                  <li>To offer tailored size recommendations and exclusive VIP previews (upon consent).</li>
                </ul>
                <h3>3. Data Protection & Security</h3>
                <p>We implement end-to-end 256-bit SSL encryption and partner solely with PCI-DSS compliant banking gateways. We never sell or lease your personal credentials to third-party marketing entities.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;

