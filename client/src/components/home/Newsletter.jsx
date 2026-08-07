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
    return () => { active = false; window.removeEventListener('orderly_settings_updated', onSync); window.removeEventListener('storage', onSync); };
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
    <section className="orderly-newsletter py-5">
      <div className="container">
        <div className="newsletter-card glass-panel text-center py-5 px-4">
          <span className="section-subtitle">ORDERLY Private Privileges</span>
          <h2 className="section-title mb-3">{settings?.newsletter_title || 'Join The ORDERLY VIP Club'}</h2>
          <p className="newsletter-desc mx-auto mb-4">
            {settings?.newsletter_text || 'Subscribe to receive private invitations to new capsule drops, bespoke trunk shows, and an instant 10% OFF code.'}
          </p>

          {subscribed ? (
            <div className="newsletter-success alert-success">
              <FiCheckCircle className="fs-4 me-2 text-success" />
              Welcome to ORDERLY VIP Club. Your code <strong>{discountCode}</strong> is active!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="newsletter-form mx-auto">
              <div className="newsletter-input-wrapper">
                <FiMail className="mail-icon" />
                <input
                  type="email"
                  placeholder="Enter your VIP email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="newsletter-input"
                />
              </div>
              <button type="submit" className="btn-primary-orderly">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;