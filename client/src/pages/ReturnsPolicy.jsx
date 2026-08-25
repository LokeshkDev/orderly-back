import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { getSettings } from '../services/api';

const ReturnsPolicy = () => {
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

  const sections = settings?.returns_policy_sections || [];

  return (
    <>
      <SEO 
        title="Returns & Exchange Policy | ORDERLY Mens Wear" 
        description="Read ORDERLY's easy 7-day returns, refund policy, and garment exchange guidelines."
        canonicalPath="/returns-policy"
      />
      <div className="orderly-policy-page section-padding">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 className="mb-4">{settings?.returns_policy_title || 'Returns & Exchange Policy'}</h1>
          <div className="glass-panel p-4 p-md-5 rounded-3">
            {sections.length === 0 && <p className="text-muted mb-0">No returns policy content has been published yet.</p>}
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

export default ReturnsPolicy;