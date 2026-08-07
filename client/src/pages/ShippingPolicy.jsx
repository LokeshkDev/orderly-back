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

  const sections = settings?.shipping_policy_sections || [];

  return (
    <>
      <SEO title="Shipping & Delivery Policy | ORDERLY Mens Wear" />
      <div className="orderly-policy-page section-padding">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 className="mb-4">{settings?.shipping_policy_title || 'Shipping & Delivery Policy'}</h1>
          <div className="glass-panel p-4 p-md-5 rounded-3">
            {sections.length === 0 && <p className="text-muted mb-0">No shipping policy content has been published yet.</p>}
            {sections.map((sec, i) => (
              <div key={i}>
                {i > 0 && <div className="mt-4" />}
                <h5 className="text-accent-red">{sec.title}</h5>
                <p className="text-muted mb-0">{sec.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingPolicy;