import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { FiAward, FiShield, FiTrendingUp } from 'react-icons/fi';
import { getSettings } from '../services/api';
import './AboutUs.css';

const AboutUs = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('orderly_site_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

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

  const cmsAbout = settings?.cms_pages?.about || {};
  const subtitle = cmsAbout.subtitle || settings?.about_us_subtitle || 'HERITAGE, PRECISION & CRAFTSMANSHIP';
  const heading = cmsAbout.title || settings?.about_us_heading || 'Redefining Modern Luxury Menswear';
  const bannerImage = cmsAbout.banner_image;
  const featuredImage = cmsAbout.featured_image || settings?.about_us_image;
  const contentHtml = cmsAbout.content_html;

  const formatContentHtml = (html) => {
    if (!html) return '';
    let cleaned = html.trim();

    // Strip inline text color styles inserted by rich text editors (e.g. Quill/Word paste)
    cleaned = cleaned.replace(/style\s*=\s*"[^"]*"/gi, (match) => {
      const stripped = match.replace(/color\s*:\s*[^;"]+;?/gi, '');
      return stripped === 'style=""' ? '' : stripped;
    });

    // If it already has rich HTML markup (h1-h6, p, ul, ol, table, etc.), preserve user's formatting directly
    const hasRichMarkup = /<\s*(?:h[1-6]|p|ul|ol|table|blockquote)\b[^>]*>/i.test(cleaned);
    if (hasRichMarkup) {
      cleaned = cleaned.replace(/Compromis(?:e)?([A-Z])/g, 'Compromise $1');
      return cleaned;
    }

    // Otherwise, parse raw/unformatted text as per the atelier story design:
    cleaned = cleaned.replace(/Compromis(?:e)?([A-Z])/g, 'Compromise $1');
    cleaned = cleaned.replace(/testing\.Inspired/g, 'testing. Inspired');
    cleaned = cleaned.replace(/sophistication\.Our/g, 'sophistication. Our');
    cleaned = cleaned.replace(/PillarsPure/g, 'Pillars: Pure');
    cleaned = cleaned.replace(/blends\.Artisanal/g, 'blends. Artisanal');
    cleaned = cleaned.replace(/seams\.Modern/g, 'seams. Modern');

    if (/Our Core Pillars/i.test(cleaned)) {
      const [introPart, pillarsPart] = cleaned.split(/Our Core Pillars:?/i);
      
      let formattedIntro = '';
      let remainingIntro = introPart.trim();
      const titleMatch = remainingIntro.match(/^(Craftsmanship Without Compromise|[^.\n]{10,60})/i);
      if (titleMatch) {
        formattedIntro += `<h2>${titleMatch[1].trim()}</h2>`;
        remainingIntro = remainingIntro.substring(titleMatch[1].length).trim();
      }

      const introSentences = remainingIntro.split(/(?<=\.)\s+/).filter(Boolean);
      if (introSentences.length > 0) {
        if (introSentences.length >= 2) {
          const mid = Math.ceil(introSentences.length / 2);
          formattedIntro += `<p>${introSentences.slice(0, mid).join(' ')}</p>`;
          formattedIntro += `<p>${introSentences.slice(mid).join(' ')}</p>`;
        } else {
          formattedIntro += `<p>${remainingIntro}</p>`;
        }
      }

      let formattedPillars = '<h3>Our Core Pillars</h3><ul>';
      const pillarItems = (pillarsPart || '')
        .split(/(?:Pure Luxury Fabrics:|Artisanal Tailoring:|Modern Elegance:)/i)
        .map(s => s.trim())
        .filter(Boolean);

      const pillarTitles = ['Pure Luxury Fabrics', 'Artisanal Tailoring', 'Modern Elegance'];
      if (pillarItems.length > 0) {
        pillarItems.forEach((item, idx) => {
          const pTitle = pillarTitles[idx] || 'Pillar';
          formattedPillars += `<li><strong>${pTitle}:</strong> ${item.replace(/^\s*:\s*/, '')}</li>`;
        });
      } else {
        formattedPillars += `<li>${pillarsPart}</li>`;
      }
      formattedPillars += '</ul>';

      return formattedIntro + formattedPillars;
    }

    const parts = cleaned.split(/\n\n+/).filter(Boolean);
    return parts.map((part, idx) => {
      if (idx === 0 && part.length < 80) {
        return `<h2>${part}</h2>`;
      }
      return `<p>${part}</p>`;
    }).join('');
  };

  const cleanHtml = formatContentHtml(contentHtml);
  const hasHeading = cleanHtml && /<\s*h[12][^>]*>/i.test(cleanHtml);
  const hasEyebrow = cleanHtml && /the atelier story/i.test(cleanHtml);
  const defaultStoryTitle = settings?.about_us_title || 'Craftsmanship Without Compromise';

  return (
    <>
      <SEO 
        title="About Our Atelier | ORDERLY Menswear" 
        description="Discover the craftsmanship, heritage, and story behind ORDERLY luxury menswear."
        canonicalPath="/about"
      />
      <main className="orderly-about-page py-5">
        {/* Animated Hero Header with Banner (if configured) */}
        {bannerImage ? (
          <div className="container-fluid px-lg-5 mb-5">
            <div
              className="cms-hero-banner rounded-4 shadow-2xl"
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,10,0.5), rgba(10,10,10,0.85)), url(${bannerImage})` }}
            >
              <div className="cms-hero-content text-center py-5">
                <span className="about-eyebrow-badge mb-2 d-inline-block">{subtitle}</span>
                <h1 className="about-hero-title display-4 fw-extrabold text-white mt-1 mb-2">{heading}</h1>
                <p className="about-hero-subtitle lead text-muted max-w-700 mx-auto mb-0">
                  Born out of a relentless passion for Italian tailoring, selvedge raw denim, and bespoke silhouettes designed for gentlemen who refuse ordinary.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <section className="about-hero-section container-fluid px-lg-5 mb-5 text-center fade-in-up">
            <span className="about-eyebrow-badge">{subtitle}</span>
            <h1 className="about-hero-title display-4 fw-extrabold text-white mt-2">{heading}</h1>
            <p className="about-hero-subtitle lead text-muted max-w-700 mx-auto mt-3">
              Born out of a relentless passion for Italian tailoring, selvedge raw denim, and bespoke silhouettes designed for gentlemen who refuse ordinary.
            </p>
          </section>
        )}

        {/* Story Section with Floating Image Card */}
        <section className="container-fluid px-lg-5 mb-5">
          <div className="row g-5 align-items-center">
            <div className="col-lg-5 fade-in-left">
              <div className="about-image-card-wrapper position-relative">
                {featuredImage ? (
                  <img
                    src={featuredImage}
                    alt="ORDERLY Atelier Studio"
                    loading="lazy"
                    decoding="async"
                    className="about-main-img img-fluid rounded-4 shadow-2xl"
                  />
                ) : (
                  <div className="orderly-img-fallback" style={{ height: '100%', minHeight: '380px' }}>ORDERLY ATELIER</div>
                )}
              </div>
            </div>

            <div className="col-lg-7 fade-in-right">
              {!hasEyebrow && (
                <span className="text-warning fw-bold text-uppercase about-story-eyebrow d-inline-block mb-2">
                  THE ATELIER STORY
                </span>
              )}

              {cleanHtml ? (
                <>
                  {!hasHeading && (
                    <h2 className="about-story-title text-white fw-extrabold fs-1 mt-1 mb-4">
                      {defaultStoryTitle}
                    </h2>
                  )}
                  <div
                    className="cms-rich-html-content"
                    dangerouslySetInnerHTML={{ __html: cleanHtml }}
                  />
                </>
              ) : (
                <>
                  <h2 className="about-story-title text-white fw-extrabold fs-1 mt-1 mb-4">
                    {defaultStoryTitle}
                  </h2>
                  <p className="about-body-p lead text-muted mb-4">
                    {settings?.about_us_text_1 || 'At ORDERLY, we believe that true luxury lies in the details — from the single-needle stitching on our 100% European linen shirts to the custom horn buttons on our double-breasted blazers.'}
                  </p>
                  <p className="about-body-p text-muted mb-4">
                    {settings?.about_us_text_2 || 'Every piece in our collection undergoes a rigorous 14-point quality inspection. We source raw materials directly from heritage mills in Italy and Japan, delivering timeless apparel engineered for perfection.'}
                  </p>
                </>
              )}

              <div className="row g-3 mt-4">
                <div className="col-6">
                  <div className="ethos-mini-card">
                    <FiShield className="text-danger fs-3 mb-2" />
                    <h6 className="text-white fw-bold mb-0">Heritage Quality</h6>
                    <span className="text-muted extra-small">Zero synthetic blends</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="ethos-mini-card">
                    <FiTrendingUp className="text-warning fs-3 mb-2" />
                    <h6 className="text-white fw-bold mb-0">Modern Fit</h6>
                    <span className="text-muted extra-small">Engineered precision fit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animated Counter Stats Section */}
        <section className="about-stats-section py-5 bg-dark-surface my-5 border-top border-bottom border-secondary fade-in-up">
          <div className="container-fluid px-lg-5">
            <div className="row g-4 text-center">
              <div className="col-6 col-md-3">
                <div className="stat-box">
                  <h2 className="stat-number text-warning">50,000+</h2>
                  <span className="stat-label text-muted">Gentlemen Dressed</span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="stat-box">
                  <h2 className="stat-number text-danger">100%</h2>
                  <span className="stat-label text-muted">Pure Natural Fabrics</span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="stat-box">
                  <h2 className="stat-number text-white">14</h2>
                  <span className="stat-label text-muted">Point Quality Inspection</span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="stat-box">
                  <h2 className="stat-number text-success">4.9 ★</h2>
                  <span className="stat-label text-muted">Customer Rating</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutUs;
