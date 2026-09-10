import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { getSettings } from '../services/api';

const ContactUs = () => {
  const [settings, setSettings] = useState(null);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const res = await getSettings();
      if (active && res?.success && res.data) {
        setSettings(res.data);
        if (res.data.store_branches) {
          try {
            const parsed = typeof res.data.store_branches === 'string'
              ? JSON.parse(res.data.store_branches)
              : res.data.store_branches;
            if (Array.isArray(parsed)) setBranches(parsed);
          } catch {}
        }
      }
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

  const cmsContact = settings?.cms_pages?.contact || {};
  const bannerImage = cmsContact.banner_image;
  const title = cmsContact.title || 'Get In Touch & Visit Our Stores';
  const subtitle = cmsContact.subtitle || '24/7 VIP CONCIERGE & BOUTIQUE LOCATIONS';
  const contentHtml = cmsContact.content_html;
  const featuredImage = cmsContact.featured_image;

  return (
    <>
      <SEO 
        title={`${title} | ORDERLY Menswear`} 
        description="Contact our 24/7 VIP concierge desk or visit ORDERLY menswear store locations across India."
        canonicalPath="/contact"
      />
      <div className="orderly-contact-page py-5">
        {bannerImage && (
          <div className="cms-hero-banner-container container-fluid px-lg-5 mb-5">
            <div
              className="cms-hero-banner rounded-4 shadow-2xl"
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,10,0.5), rgba(10,10,10,0.85)), url(${bannerImage})` }}
            >
              <div className="cms-hero-content text-center py-5">
                <span className="badge bg-warning text-dark text-uppercase px-3 py-1 mb-2 font-weight-bold">
                  {subtitle}
                </span>
                <h1 className="display-4 fw-extrabold text-white mt-1 mb-2">{title}</h1>
                <p className="lead text-muted max-w-700 mx-auto mb-0">
                  We are here to assist with custom orders, styling, sizing, and boutique appointments.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="container-fluid px-lg-5">
          {!bannerImage && (
            <div className="section-title-wrapper text-center mb-5">
              <span className="section-subtitle text-warning font-weight-bold">{subtitle}</span>
              <h1 className="section-title text-white fw-bold">{title}</h1>
            </div>
          )}

          {/* CMS Rich Content Section (if present) */}
          {contentHtml && (
            <div className="cms-contact-rich-section mb-5">
              <div className="glass-panel p-4 p-md-5 rounded-4 border border-secondary shadow-lg">
                <div className="row g-4 align-items-center">
                  {featuredImage && (
                    <div className="col-lg-5 text-center">
                      <img
                        src={featuredImage}
                        alt="ORDERLY Showroom"
                        loading="lazy"
                        decoding="async"
                        className="img-fluid rounded-4 shadow-2xl"
                        style={{ maxHeight: '420px', objectFit: 'cover', width: '100%' }}
                      />
                    </div>
                  )}
                  <div className={featuredImage ? 'col-lg-7' : 'col-12'}>
                    <div
                      className="cms-rich-html-content"
                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Section: VIP Concierge Desk */}
          <div className="concierge-desk-wrapper mb-5">
            <div className="glass-panel p-4 p-md-5 rounded-3 border border-secondary">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border-bottom border-secondary pb-3">
                <div>
                  <span className="badge bg-danger text-uppercase px-3 py-1 mb-2">Priority Support</span>
                  <h3 className="text-warning fw-bold mb-1">ORDERLY VIP Concierge Desk</h3>
                  <p className="text-muted small mb-0">Dedicated assistance for bespoke styling, sizing guidance, order tracking, and private boutique appointments.</p>
                </div>
              </div>

              <div className="row g-4">
                {settings?.contact_phone && (
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 rounded-2 h-100 bg-dark bg-opacity-50 border border-secondary">
                      <FiPhone className="fs-3 text-warning mb-2" />
                      <h6 className="text-white mb-1">Direct Phone Concierge</h6>
                      <a href={`tel:${settings.contact_phone}`} className="text-muted text-decoration-none small d-block">{settings.contact_phone}</a>
                    </div>
                  </div>
                )}

                {settings?.contact_whatsapp && (
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 rounded-2 h-100 bg-dark bg-opacity-50 border border-secondary">
                      <FaWhatsapp className="fs-3 text-success mb-2" />
                      <h6 className="text-white mb-1">WhatsApp Instant Support</h6>
                      <a href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-success text-decoration-none small fw-bold d-block">
                        Chat on WhatsApp ({settings.contact_whatsapp})
                      </a>
                    </div>
                  </div>
                )}

                {settings?.contact_email && (
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 rounded-2 h-100 bg-dark bg-opacity-50 border border-secondary">
                      <FiMail className="fs-3 text-danger mb-2" />
                      <h6 className="text-white mb-1">VIP Support Email</h6>
                      <a href={`mailto:${settings.contact_email}`} className="text-muted text-decoration-none small d-block">{settings.contact_email}</a>
                    </div>
                  </div>
                )}

                {settings?.support_hours && (
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 rounded-2 h-100 bg-dark bg-opacity-50 border border-secondary">
                      <FiClock className="fs-3 text-warning mb-2" />
                      <h6 className="text-white mb-1">Concierge Operating Hours</h6>
                      <p className="text-muted small mb-0">{settings.support_hours}</p>
                    </div>
                  </div>
                )}

                {settings?.contact_address && (
                  <div className="col-12 mt-3">
                    <div className="p-3 rounded-2 bg-dark bg-opacity-50 border border-secondary d-flex align-items-start gap-3">
                      <FiMapPin className="fs-3 text-danger mt-1 flex-shrink-0" />
                      <div>
                        <h6 className="text-white mb-1">Corporate Headquarters</h6>
                        <p className="text-muted small mb-0">{settings.contact_address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section: Multi-Branch Boutique Locations & Google Maps */}
          {branches.length > 0 && (
            <div className="store-branches-section pt-4 border-top border-secondary">
              <div className="text-center mb-4">
                <h2 className="text-white fw-bold">Visit Our Physical Boutiques & Tailoring Studios</h2>
                <p className="text-muted small">Experience luxury fabrics, fitting sessions, and personal styling at our store locations.</p>
              </div>

              <div className="row g-4">
                {branches.map((branch, idx) => (
                  <div key={branch.id || idx} className="col-12 col-md-6">
                    <div className="glass-panel p-4 rounded-3 h-100 border border-secondary d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge bg-warning text-dark fw-bold">BOUTIQUE STORE #{idx + 1}</span>
                          <span className="text-muted small"><FiClock className="me-1" /> {branch.hours}</span>
                        </div>
                        <h4 className="text-white fw-bold mb-2">{branch.name}</h4>
                        <p className="text-muted small mb-3">
                          <FiMapPin className="text-danger me-1" /> {branch.address}
                        </p>
                        {branch.phone && (
                          <p className="text-muted small mb-3">
                            <FiPhone className="text-primary me-1" /> <a href={`tel:${branch.phone}`} className="text-white text-decoration-none fw-bold">{branch.phone}</a>
                          </p>
                        )}
                      </div>

                      {branch.map_url && (
                        <div className="ratio ratio-16x9 rounded overflow-hidden border border-secondary mt-3">
                          <iframe 
                            src={branch.map_url} 
                            title={branch.name} 
                            style={{ border: 0 }} 
                            allowFullScreen="" 
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ContactUs;
