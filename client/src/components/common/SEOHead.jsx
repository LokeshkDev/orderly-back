import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://orderlymenswear.in';
const DEFAULT_LOGO = 'https://orderlymenswear.in/assets/media/logo-07E_iIRS.png';

const SEOHead = ({
  title = "ORDERLY Mens Wear | Premium Men's Apparel & Streetwear Store",
  description = "Shop luxury men's shirts, oversized t-shirts, premium denim, and curated outfit combos at ORDERLY. Free shipping and cash on delivery across India.",
  keywords = "ORDERLY, men's wear, luxury shirts, oversized tees, streetwear india, selvedge denim, premium combos, buy men clothes online",
  canonicalPath = '',
  image = DEFAULT_LOGO,
  type = 'website',
  product = null,
  breadcrumbs = []
}) => {
  const fullCanonicalUrl = canonicalPath ? `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath}` : BASE_URL;
  const fullImageUrl = image.startsWith('http') ? image : `${BASE_URL}${image.startsWith('/') ? image : '/' + image}`;

  // 1. Organization & WebSite JSON-LD Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ORDERLY Mens Wear",
    "url": BASE_URL,
    "logo": DEFAULT_LOGO,
    "sameAs": [
      "https://www.instagram.com/orderlymenswear",
      "https://www.facebook.com/orderlymenswear"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": "English"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ORDERLY Mens Wear",
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  // 2. Product Schema (if on PDP)
  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": Array.isArray(product.images) && product.images.length > 0 
      ? product.images.map(img => typeof img === 'string' ? (img.startsWith('http') ? img : `${BASE_URL}${img}`) : (img.url || DEFAULT_LOGO))
      : [fullImageUrl],
    "description": product.metaDescription || product.description || `Buy ${product.name} at ORDERLY Mens Wear.`,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "ORDERLY"
    },
    "offers": {
      "@type": "Offer",
      "url": fullCanonicalUrl,
      "priceCurrency": "INR",
      "price": product.price,
      "priceValidUntil": "2027-12-31",
      "availability": product.stock <= 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "ORDERLY Mens Wear"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating || "4.8",
      "reviewCount": product.reviewsCount || "120"
    }
  } : null;

  // 3. Breadcrumbs Schema
  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url ? (item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`) : fullCanonicalUrl
    }))
  } : null;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="ORDERLY Mens Wear" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
