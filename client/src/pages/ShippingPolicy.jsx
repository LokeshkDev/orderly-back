import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { getSettings } from '../services/api';

const ShippingPolicy = () => {
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
    return () => { active = false; window.removeEventListener('orderly_settings_updated', onSync); window.removeEventListener('storage', onSync); };
  }, []);

  const cmsPolicy = settings?.cms_pages?.policy || {};
  const bannerImage = cmsPolicy.banner_image;
  const contentHtml = cmsPolicy.content_html;
  const pageTitle = cmsPolicy.title || settings?.shipping_policy_title || 'Shipping & Delivery Policy';
  const pageSubtitle = cmsPolicy.subtitle || 'Express Domestic Timelines & Rates';
  const sections = settings?.shipping_policy_sections || [];

  return (
    <>
      <SEO 
        title={`${pageTitle} | ORDERLY Mens Wear`} 
        description="Learn about ORDERLY shipping rates, express delivery timelines, and free shipping thresholds across India."
        canonicalPath="/shipping-policy"
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
                  {pageSubtitle}
                </span>
                <h1 className="display-4 fw-extrabold text-white mt-1 mb-2">{pageTitle}</h1>
              </div>
            </div>
          </div>
        )}

        <div className="container" style={{ maxWidth: '900px' }}>
          {!bannerImage && (
            <div className="text-center mb-5">
              <span className="badge bg-warning text-dark text-uppercase px-3 py-1 mb-2 font-weight-bold">
                {pageSubtitle}
              </span>
              <h1 className="display-5 fw-extrabold text-white mt-1 mb-2">{pageTitle}</h1>
            </div>
          )}

          <div className="glass-panel p-4 p-md-5 rounded-4 border border-secondary shadow-lg">
            {contentHtml ? (
              <div
                className="cms-rich-html-content"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            ) : (
              <>
                {sections.length === 0 && <p className="text-muted mb-0">No shipping policy content has been published yet.</p>}
                {sections.map((sec, i) => (
                  <div key={i}>
                    {i > 0 && <div className="mt-4" />}
                    <h5 className="text-accent-red">{sec.title}</h5>
                    <p className="text-muted mb-0">{sec.text}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingPolicy;