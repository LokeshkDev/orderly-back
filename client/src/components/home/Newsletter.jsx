import React, { useState, useEffect } from 'react';
import { FiMail, FiCheckCircle } from 'react-icons/fi';
import { getSettings } from '../../services/api';
import './Newsletter.css';

const Newsletter = () => {
  const [settings, setSettings] = useState(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const discountCode = settings?.newsletter_discount_code || 'ORDERLY10';

  return (
    <section className="orderly-newsletter-section py-5">
      <div className="container-fluid px-lg-5">
        <div className="newsletter-banner-box">
          <div className="row align-items-center g-4">
            {/* Left Content with Icon */}
            <div className="col-lg-6">
              <div className="d-flex align-items-start gap-3">
                <div className="newsletter-icon-circle">
                  <FiMail className="newsletter-icon-red" />
                </div>
                <div>
                  <h3 className="newsletter-main-title">
                    {settings?.newsletter_title || 'STAY IN THE LOOP'}
                  </h3>
                  <p className="newsletter-main-desc mb-0">
                    {settings?.newsletter_text || 'Subscribe to get updates on new arrivals, exclusive offers and more.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side Form */}
            <div className="col-lg-6">
              {subscribed ? (
                <div className="newsletter-success-badge">
                  <FiCheckCircle className="fs-5 me-2 text-success" />
                  Welcome! Your 10% discount code <strong>{discountCode}</strong> is now active.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="newsletter-subscribe-form">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="newsletter-email-input"
                  />
                  <button type="submit" className="btn-newsletter-solid-red">
                    SUBSCRIBE
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;