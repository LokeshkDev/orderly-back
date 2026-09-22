/**
 * Analytics Utility for Google Tag (gtag.js) & Meta Pixel (fbq)
 * Google Tag ID: G-W63VGKMK63
 * Meta Pixel ID: 1789836052355580
 */

// Helper to safely call window.gtag
export const trackGtagEvent = (action, params = {}) => {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', action, params);
    }
  } catch (err) {
    console.warn('Google Tag event dispatch note:', err.message);
  }
};

// Helper to safely call window.fbq (Meta Pixel)
export const trackMetaPixelEvent = (eventName, params = {}) => {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', eventName, params);
    }
  } catch (err) {
    console.warn('Meta Pixel event dispatch note:', err.message);
  }
};

/**
 * Track SPA Route Change / Page View
 */
export const trackPageView = (url, title) => {
  const pagePath = url || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  const pageTitle = title || (typeof document !== 'undefined' ? document.title : 'ORDERLY Mens Wear');

  // Google Tag Pageview
  trackGtagEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    send_to: 'G-W63VGKMK63'
  });

  // Meta Pixel Pageview
  trackMetaPixelEvent('PageView');
};

/**
 * 1. ViewContent — Product Page / Quick View
 * Triggered on Product Detail Page, Combo Detail Page, and QuickView Modal
 */
export const trackViewItem = (item) => {
  if (!item) return;
  const id = String(item.id || item.productId || item.product_id || item.sku || '');
  const name = item.name || item.title || 'Product';
  const price = Math.max(0, Number(item.price || item.offer_price || item.unit_price || 0));
  const category = item.category || (item.isCombo ? 'Combos' : 'Apparel');

  // Google Analytics 4: view_item
  trackGtagEvent('view_item', {
    currency: 'INR',
    value: price,
    items: [
      {
        item_id: id,
        item_name: name,
        item_category: category,
        price: price,
        quantity: 1
      }
    ]
  });

  // Meta Pixel: ViewContent
  trackMetaPixelEvent('ViewContent', {
    content_name: name,
    content_ids: [id],
    content_type: 'product',
    content_category: category,
    value: price,
    currency: 'INR'
  });
};

/**
 * 2. AddToCart — When Product is added to Cart
 * Triggered for single items, combo bundles, and paired items
 */
export const trackAddToCart = (item, quantity = 1) => {
  if (!item) return;
  const id = String(item.id || item.productId || item.product_id || item.sku || '');
  const name = item.name || item.title || 'Product';
  const price = Math.max(0, Number(item.price || item.offer_price || item.unit_price || 0));
  const category = item.category || (item.isCombo ? 'Combos' : 'Apparel');
  const qty = Math.max(1, Number(quantity || 1));

  // Google Analytics 4: add_to_cart
  trackGtagEvent('add_to_cart', {
    currency: 'INR',
    value: price * qty,
    items: [
      {
        item_id: id,
        item_name: name,
        item_category: category,
        price: price,
        quantity: qty,
        item_variant: item.selectedSize || item.selectedColor || ''
      }
    ]
  });

  // Meta Pixel: AddToCart
  trackMetaPixelEvent('AddToCart', {
    content_name: name,
    content_ids: [id],
    content_type: 'product',
    content_category: category,
    value: price * qty,
    currency: 'INR',
    num_items: qty
  });
};

/**
 * 3. InitiateCheckout — Checkout Started
 * Triggered when clicking "Proceed To Checkout" or loading the Checkout page
 */
export const trackInitiateCheckout = (items = [], total = 0) => {
  const parsedItems = Array.isArray(items) ? items.map(item => ({
    item_id: String(item.id || item.productId || item.product_id || item.sku || ''),
    item_name: item.name || 'Product',
    price: Math.max(0, Number(item.price || item.unit_price || 0)),
    quantity: Math.max(1, Number(item.quantity || 1))
  })) : [];

  const itemIds = parsedItems.map(i => i.item_id).filter(Boolean);
  const totalQuantity = parsedItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const totalValue = Math.max(0, Number(total || 0));

  // Google Analytics 4: begin_checkout
  trackGtagEvent('begin_checkout', {
    currency: 'INR',
    value: totalValue,
    items: parsedItems
  });

  // Meta Pixel: InitiateCheckout
  trackMetaPixelEvent('InitiateCheckout', {
    content_name: 'Store Checkout',
    content_ids: itemIds,
    content_type: 'product',
    num_items: totalQuantity > 0 ? totalQuantity : 1,
    value: totalValue,
    currency: 'INR'
  });
};

/**
 * 4. Purchase — Only After Successful Order / Payment Completion
 * Triggered on Order Confirmation page with deduplication against refreshes
 */
export const trackPurchase = (order = {}) => {
  const orderNumber = String(order.order_number || order.id || Date.now());
  const total = Math.max(0, Number(order.total || order.amount || 0));
  const items = Array.isArray(order.items) ? order.items : [];

  const parsedItems = items.map(item => ({
    item_id: String(item.productId || item.product_id || item.id || item.sku || ''),
    item_name: item.name || item.product_name || 'Product',
    price: Math.max(0, Number(item.price || item.unit_price || 0)),
    quantity: Math.max(1, Number(item.quantity || 1))
  }));

  const itemIds = parsedItems.map(i => i.item_id).filter(Boolean);
  const totalQuantity = parsedItems.reduce((sum, i) => sum + (i.quantity || 1), 0);

  // Google Analytics 4: purchase
  trackGtagEvent('purchase', {
    transaction_id: orderNumber,
    value: total,
    currency: 'INR',
    shipping: Number(order.shipping_fee || 0),
    discount: Number(order.discount || 0),
    items: parsedItems
  });

  // Meta Pixel: Purchase
  trackMetaPixelEvent('Purchase', {
    content_ids: itemIds.length > 0 ? itemIds : [orderNumber],
    content_type: 'product',
    num_items: totalQuantity > 0 ? totalQuantity : 1,
    value: total,
    currency: 'INR',
    order_id: orderNumber
  });
};
