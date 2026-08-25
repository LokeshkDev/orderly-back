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
  breadcrumbs = [],
  itemList = null,
  noindex = false
}) => {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const resolvedPath = canonicalPath || currentPath;
  const fullCanonicalUrl = resolvedPath ? `${BASE_URL}${resolvedPath.startsWith('/') ? resolvedPath : '/' + resolvedPath}` : BASE_URL;
  const fullImageUrl = image.startsWith('http') ? image : `${BASE_URL}${image.startsWith('/') ? image : '/' + image}`;

  // 1. Organization Schema
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

  // 2. WebSite Schema with SearchAction
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

  // 3. High-Fidelity Product / Offer Schema (Strictly verified genuine fields without synthetic review generation)
  const productSchema = product ? (() => {
    const rawRating = Number(product.rating);
    const rawReviewCount = Number(product.reviewsCount || product.reviews_count || (Array.isArray(product.reviews) ? product.reviews.length : 0));
    const hasValidRating = !isNaN(rawRating) && rawRating > 0 && !isNaN(rawReviewCount) && rawReviewCount > 0;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": Array.isArray(product.images) && product.images.length > 0 
        ? product.images.map(img => typeof img === 'string' ? (img.startsWith('http') ? img : `${BASE_URL}${img}`) : (img.url || DEFAULT_LOGO))
        : [fullImageUrl],
      "description": product.metaDescription || product.description || `Buy ${product.name} at ORDERLY Mens Wear.`,
      "sku": String(product.sku || product.id),
      "brand": {
        "@type": "Brand",
        "name": product.brand || "ORDERLY"
      },
      "offers": {
        "@type": "Offer",
        "url": fullCanonicalUrl,
        "priceCurrency": "INR",
        "price": String(product.price),
        "priceValidUntil": "2027-12-31",
        "availability": (product.stock !== undefined && product.stock <= 0) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "Organization",
          "name": "ORDERLY Mens Wear"
        }
      }
    };

    if (hasValidRating) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": String(rawRating),
        "reviewCount": String(rawReviewCount)
      };
    }

    return schema;
  })() : null;

  // 4. Category / Collection ItemList Schema (if on Shop or Combos)
  const itemListSchema = itemList && Array.isArray(itemList.items) && itemList.items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": itemList.name || title,
    "description": itemList.description || description,
    "numberOfItems": itemList.items.length,
    "itemListElement": itemList.items.slice(0, 20).map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "url": `${BASE_URL}/product/${item.slug || item.id}`
    }))
  } : null;

  // 5. Breadcrumbs Schema
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

      {/* Crawling and Robots Directives */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'product' || product ? 'product' : 'website'} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="ORDERLY Mens Wear" />

      {/* Extended OpenGraph Product Metadata */}
      {product && (
        <>
          <meta property="product:price:amount" content={String(product.price)} />
          <meta property="product:price:currency" content="INR" />
          <meta property="product:availability" content={(product.stock !== undefined && product.stock <= 0) ? "out of stock" : "in stock"} />
          <meta property="product:condition" content="new" />
          <meta property="product:brand" content={product.brand || "ORDERLY"} />
        </>
      )}

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
      {itemListSchema && (
        <script type="application/ld+json">
          {JSON.stringify(itemListSchema)}
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
