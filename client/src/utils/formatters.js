// Formatting utilities for ORDERLY Mens Wear

export const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const calculateDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Normalize a product coming from the API (DB rows) into a consistent
// shape: images: string[], colors: {name, hex, images?}[], sizes: string[]
const toUrl = (img) => {
  if (!img) return null;
  if (typeof img === 'string') return img;
  return img.image_url || img.url || null;
};

export function normalizeProduct(product) {
  if (!product) return null;

  const rawImages = Array.isArray(product.images) ? product.images
    : Array.isArray(product.ProductImages) ? product.ProductImages
    : Array.isArray(product.ComboImages) ? product.ComboImages : [];

  const images = rawImages.map(toUrl).filter(Boolean);

  const rawColors = Array.isArray(product.colors) ? product.colors
    : Array.isArray(product.ProductColors) ? product.ProductColors
    : Array.isArray(product.ComboColors) ? product.ComboColors : [];

  const colors = rawColors
    .map((c) => {
      if (typeof c === 'string') return { name: c, hex: '#000000', images: [] };
      return {
        name: c.name,
        hex: c.hex || c.hex_code || '#000000',
        images: Array.isArray(c.images) ? c.images.map(toUrl).filter(Boolean) : []
      };
    })
    .filter((c) => c && c.name);

  // Merge color-specific images into the flat list (deduped)
  colors.forEach((c) => {
    c.images.forEach((u) => { if (!images.includes(u)) images.push(u); });
  });

  const rawSizes = Array.isArray(product.sizes) ? product.sizes
    : Array.isArray(product.ProductSizes) ? product.ProductSizes
    : Array.isArray(product.ComboSizes) ? product.ComboSizes : [];

  const sizes = rawSizes
    .map((s) => (typeof s === 'string' ? s : s.size_label || s.label || s))
    .filter(Boolean);

  return {
    ...product,
    images,
    colors,
    sizes
  };
}

// Return images for a specific color (falls back to the product's flat images)
export function colorImages(product, colorName) {
  const p = product && product.colors ? product : normalizeProduct(product);
  if (!p) return [];
  const match = Array.isArray(p.colors) && p.colors.find((c) => c.name === colorName);
  if (match && match.images && match.images.length > 0) return match.images;
  return p.images || [];
}
