import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "ORDERLY Mens Wear | Premium Men's Fashion & Luxury Apparel", 
  description = "ORDERLY Mens Wear, luxury men's fashion house crafting world-class menswear.",
  keywords = "mens fashion, luxury menswear, orderly mens wear",
  image = "/src/assets/logo/logo.jpeg"
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
