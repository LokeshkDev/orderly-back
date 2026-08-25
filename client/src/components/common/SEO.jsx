import React from 'react';
import SEOHead from './SEOHead';

/**
 * Standardized SEO delegate to maintain backward compatibility while ensuring
 * full JSON-LD structured data, canonical tags, OpenGraph product data, and robots directives.
 */
const SEO = ({ 
  title, 
  description, 
  keywords, 
  image,
  canonicalPath,
  type = 'website',
  product,
  breadcrumbs,
  itemList,
  noindex = false
}) => {
  return (
    <SEOHead
      title={title}
      description={description}
      keywords={keywords}
      image={image && !image.includes('/src/') ? image : undefined}
      canonicalPath={canonicalPath}
      type={type}
      product={product}
      breadcrumbs={breadcrumbs}
      itemList={itemList}
      noindex={noindex}
    />
  );
};

export default SEO;
