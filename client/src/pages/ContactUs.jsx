import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { getSettings } from '../services/api';

const ContactUs = () => {
  const [settings, setSettings] = useState(null);
  const [branches, setBranches] = useState([]);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <SEO title="Contact & Store Locations | ORDERLY Menswear" />
      <div className="orderly-contact-page py-5">
        <div className="container-fluid px-lg-5">
          <div className="section-title-wrapper text-center mb-5">
            <span className="section-subtitle text-warning font-weight-bold">24/7 VIP CONCIERGE & BOUTIQUE LOCATIONS</span>
            <h1 className="section-title text-white fw-bold">Get In Touch & Visit Our Stores</h1>
          </div>

          {/* Top Section: Concierge Desk & Message Form */}
          <div className="row g-4 mb-5">
            <div className="col-lg-5">
              <div className="glass-panel p-4 rounded-3 h-100 border border-secondary">
                <h4 className="mb-4 text-warning fw-bold">ORDERLY VIP Concierge Desk</h4>
                
                {settings?.contact_phone && (
                  <div className="d-flex align-items-start gap-3 mb-4">
                    <FiPhone className="fs-3 text-warning mt-1" />
                    <div>
                      <h6 className="text-white mb-1">Direct Phone Concierge</h6>
                      <a href={`tel:${settings.contact_phone}`} className="text-muted text-decoration-none small">{settings.contact_phone}</a>
                    </div>
                  </div>
                )}

                {settings?.contact_whatsapp && (
                  <div className="d-flex align-items-start gap-3 mb-4">
                    <FaWhatsapp className="fs-3 text-success mt-1" />
                    <div>
                      <h6 className="text-white mb-1">WhatsApp Instant Support</h6>
                      <a href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-success text-decoration-none small fw-bold">
                        Chat on WhatsApp ({settings.contact_whatsapp})
                      </a>
                    </div>
                  </div>
                )}

                {settings?.contact_email && (
                  <div className="d-flex align-items-start gap-3 mb-4">
                    <FiMail className="fs-3 text-danger mt-1" />
                    <div>
                      <h6 className="text-white mb-1">VIP Support Email</h6>
                      <a href={`mailto:${settings.contact_email}`} className="text-muted text-decoration-none small">{settings.contact_email}</a>
                    </div>
                  </div>
                )}

                {settings?.support_hours && (
                  <div className="d-flex align-items-start gap-3 mb-4">
                    <FiClock className="fs-3 text-warning mt-1" />
                    <div>
                      <h6 className="text-white mb-1">Concierge Operating Hours</h6>
                      <p className="text-muted small mb-0">{settings.support_hours}</p>
                    </div>
                  </div>
                )}

                {settings?.contact_address && (
                  <div className="d-flex align-items-start gap-3">
                    <FiMapPin className="fs-3 text-danger mt-1" />
                    <div>
                      <h6 className="text-white mb-1">Corporate Headquarters</h6>
                      <p className="text-muted small mb-0">{settings.contact_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-7">
              <div className="glass-panel p-4 p-md-5 rounded-3 border border-secondary">
                <h4 className="mb-4 text-white">Send Us A Message</h4>
                {submitted ? (
                  <div className="alert alert-success p-4 rounded text-center">
                    <FiCheckCircle className="fs-2 me-2" /> Message received! Our concierge will contact you within 2 hours.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <input type="text" placeholder="Your Name *" required className="form-control bg-dark text-white border-secondary py-2.5" />
                      </div>
                      <div className="col-md-6">
                        <input type="email" placeholder="Your Email *" required className="form-control bg-dark text-white border-secondary py-2.5" />
                      </div>
                      <div className="col-12">
                        <input type="text" placeholder="Subject" className="form-control bg-dark text-white border-secondary py-2.5" />
                      </div>
                      <div className="col-12">
                        <textarea rows="4" placeholder="How can we assist you today? *" required className="form-control bg-dark text-white border-secondary"></textarea>
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn-primary-orderly px-4 py-3">
                          <FiSend /> Send Message
                        </button>
                      </div>
                    </div>
                  </form>
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
