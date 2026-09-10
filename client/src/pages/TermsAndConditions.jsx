import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { getSettings } from '../services/api';
import './PolicyPages.css';

const TermsAndConditions = () => {
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

  const pageData = settings?.cms_pages?.terms || {};
  const bannerImage = pageData.banner_image;
  const title = pageData.title || 'Terms & Conditions';
  const subtitle = pageData.subtitle || 'User Agreement & Sizing Guidelines';
  const contentHtml = pageData.content_html;

  return (
    <>
      <SEO
        title={`${title} | ORDERLY Menswear`}
        description="Read the terms and conditions governing the purchase and usage of ORDERLY luxury menswear."
        canonicalPath="/terms-and-conditions"
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
                  Legal & Sizing Policies
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
                Legal & Sizing Policies
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
                <h2>Terms of Service</h2>
                <p>Welcome to ORDERLY. By browsing our boutique, accessing our digital catalog, or placing an order, you agree to be bound by these Terms and Conditions.</p>
                <h3>1. Product Accuracy & Sizing</h3>
                <p>We take meticulous care in representing garments with accurate colors, texture fidelity, and sizing dimensions. Slight variances in natural linen grain or screen calibration may occur.</p>
                <h3>2. Pricing & Payments</h3>
                <p>All prices displayed on our website are inclusive of applicable GST taxes in Indian Rupees (INR). We reserve the right to revise pricing or rectify typographical discrepancies at any moment prior to confirmation.</p>
                <h3>3. Intellectual Property</h3>
                <p>All imagery, styling designs, brand marks, and digital assets are the exclusive intellectual property of ORDERLY Mens Wear. Unauthorized reproduction or commercial distribution is strictly prohibited.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsAndConditions;

