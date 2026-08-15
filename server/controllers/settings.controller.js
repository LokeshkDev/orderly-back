import db from '../models/index.js';
import { DEFAULT_DELIVERY_SETTINGS, DEFAULT_COURIER_SETTINGS } from '../utils/deliveryCalculator.js';
import { DEFAULT_PAIR_OFFER_SETTINGS } from '../utils/pairOfferCalculator.js';

const { SiteSetting } = db;

export const DEFAULT_EMAIL_SETTINGS = {
  new_order: {
    enabled: true,
    subject: 'ORDERLY | Order Confirmed | #{{orderNumber}}',
    custom_message: ''
  },
  order_shipped: {
    enabled: true,
    subject: 'ORDERLY | Your Order Has Been Shipped! | #{{orderNumber}}',
    custom_message: ''
  },
  order_delivered: {
    enabled: true,
    subject: 'ORDERLY | Your Order Has Been Delivered! | #{{orderNumber}}',
    custom_message: ''
  }
};

export const DEFAULT_FOOTER_SETTINGS = {
  bio: "Orderly is your destination for premium men's wear. Crafted for style, built for comfort, made for you.",
  copyright: "© 2026 Orderly. All Rights Reserved.",
  social_links: [
    { id: 'soc-1', platform: 'facebook', name: 'Facebook', url: 'https://facebook.com', enabled: true },
    { id: 'soc-2', platform: 'instagram', name: 'Instagram', url: 'https://instagram.com', enabled: true },
    { id: 'soc-3', platform: 'twitter', name: 'Twitter / X', url: 'https://twitter.com', enabled: true },
    { id: 'soc-4', platform: 'youtube', name: 'YouTube', url: 'https://youtube.com', enabled: true }
  ],
  columns: [
    {
      id: 'col-1',
      title: 'SHOP',
      links: [
        { id: 'link-1-1', label: 'All Products', url: '/shop' },
        { id: 'link-1-2', label: 'Shirts', url: '/shop?category=Shirts' },
        { id: 'link-1-3', label: 'T-Shirts', url: '/shop?category=Tees' },
        { id: 'link-1-4', label: 'Pants', url: '/shop?category=Pants' },
        { id: 'link-1-5', label: 'Jackets', url: '/shop?category=Jackets' },
        { id: 'link-1-6', label: 'Accessories', url: '/shop?category=Accessories' }
      ]
    },
    {
      id: 'col-2',
      title: 'CUSTOMER CARE',
      links: [
        { id: 'link-2-1', label: 'Track Order', url: '/contact' },
        { id: 'link-2-2', label: 'Returns & Refunds', url: '/returns-policy' },
        { id: 'link-2-3', label: 'Shipping Policy', url: '/shipping-policy' },
        { id: 'link-2-4', label: 'Size Guide', url: '/about' },
        { id: 'link-2-5', label: 'FAQs', url: '/contact' },
        { id: 'link-2-6', label: 'Contact Us', url: '/contact' }
      ]
    },
    {
      id: 'col-3',
      title: 'COMPANY',
      links: [
        { id: 'link-3-1', label: 'About Us', url: '/about' },
        { id: 'link-3-2', label: 'Our Story', url: '/about' },
        { id: 'link-3-3', label: 'Careers', url: '/about' },
        { id: 'link-3-4', label: 'Privacy Policy', url: '/returns-policy' },
        { id: 'link-3-5', label: 'Terms & Conditions', url: '/shipping-policy' }
      ]
    }
  ],
  payment_methods: [
    { id: 'pay-1', label: 'VISA', enabled: true },
    { id: 'pay-2', label: 'MASTERCARD', enabled: true },
    { id: 'pay-3', label: 'UPI', enabled: true },
    { id: 'pay-4', label: 'PAYTM', enabled: true }
  ],
  security_badge_text: '100% Secure Payments'
};

// Server-side default content — the MySQL database (managed via the Admin
// panel) is the single source of truth for the website. These defaults only
// apply until an admin saves their own values.
const DEFAULT_SETTINGS = {
  store_name: 'ORDERLY Mens Wear',
  store_tagline: "ORDERLY Mens Wear is a luxury fashion house dedicated to crafting world-class men's apparel. From bespoke Italian linen shirts to heavy streetwear tees and regal family combos.",
  cod_enabled: 'true',
  contact_phone: '+91 98765 43210 (Mon - Sat 10:00 AM - 7:00 PM IST)',
  contact_email: 'info@orderlymenswear.com',
  contact_address: 'ORDERLY 2.0 Valasaravakkam, Kundrathur.',
  announcements: [
    "✦ COMPLIMENTARY EXPRESS SHIPPING ON ALL ORDERS ABOVE ₹2,500 ✦",
    "✦ BESPOKE LUXURY MENSWEAR, CRAFTED FOR YOU ✦"
  ],
  about_us_subtitle: 'Our Heritage & Vision',
  about_us_heading: 'Redefining Luxury Menswear',
  about_us_title: 'Craftsmanship Without Compromise',
  about_us_text_1: "Founded with a mission to eliminate low-grade template clothing, ORDERLY Mens Wear crafts bespoke menswear that commands respect. From Italian flax linen tuxedo shirts to heavy streetwear tees and synchronized father-son heritage sets, every piece undergoes rigorous quality testing.",
  about_us_text_2: "Inspired by the aesthetic codes of Zara, Rare Rabbit, and H&M Premium, our garments offer tailored precision and timeless sophistication.",
  about_us_image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
  shipping_policy_title: 'Shipping & Delivery Policy',
  shipping_policy_sections: [
    { title: '1. Express Domestic Shipping', text: 'We offer complimentary express shipping across India on all orders exceeding ₹2,500. Orders below ₹2,500 incur a nominal flat shipping fee of ₹199.' },
    { title: '2. Dispatch Timelines', text: 'Orders are processed and dispatched within 24 hours of placement. Metro cities enjoy delivery within 48-72 hours.' },
    { title: '3. Real-Time Order Tracking', text: 'Once your parcel is dispatched, a SMS and email containing your live tracking URL will be transmitted automatically.' }
  ],
  returns_policy_title: 'Returns & Exchange Policy',
  returns_policy_sections: [
    { title: '1. 15-Day Hassle-Free Returns', text: 'At ORDERLY, we want you to be completely satisfied with your purchase. You may request a doorstep return or size exchange within 15 days of delivery.' },
    { title: '2. Condition Requirements', text: 'Items must be unworn, unwashed, with all original tags attached and in their original packaging box.' },
    { title: '3. Instant Doorstep Pickup', text: 'Our courier executive will pick up the item directly from your address. Refunds are credited instantly once verified.' }
  ],
  newsletter_title: 'Join The ORDERLY VIP Club',
  newsletter_text: 'Subscribe to receive private invitations to new capsule drops, bespoke trunk shows, and an instant 10% OFF code.',
  newsletter_discount_code: 'ORDERLY10',
  free_shipping_threshold: '2500',
  shipping_fee: '199',
  cod_advance_percentage: '10',
  delivery_estimate_text: 'Within 2-3 Business Days',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  youtube_url: 'https://youtube.com',
  delivery_settings: DEFAULT_DELIVERY_SETTINGS,
  courier_settings: DEFAULT_COURIER_SETTINGS,
  email_settings: DEFAULT_EMAIL_SETTINGS,
  footer_settings: DEFAULT_FOOTER_SETTINGS,
  pair_offer_enabled: 'true',
  pair_offer_discount_percent: '25',
  pair_offer_min_products: '2',
  pair_offer_settings: DEFAULT_PAIR_OFFER_SETTINGS
};

const parseValue = (row) => {
  if (row.setting_type === 'json' && typeof row.setting_value === 'string') {
    try {
      return JSON.parse(row.setting_value);
    } catch (err) {
      return row.setting_value;
    }
  }
  if (row.setting_type === 'boolean') {
    return row.setting_value === 'true' || row.setting_value === true;
  }
  return row.setting_value;
};

export const getPublicSettings = async (req, res) => {
  try {
    let settings = {};
    try {
      const rows = await SiteSetting.findAll();
      rows.forEach(r => { settings[r.setting_key] = parseValue(r); });
    } catch (err) {}

    res.status(200).json({ success: true, data: { ...DEFAULT_SETTINGS, ...settings } });
  } catch (error) {
    res.status(200).json({ success: true, data: DEFAULT_SETTINGS });
  }
};

export const getAllSettings = async (req, res) => {
  return getPublicSettings(req, res);
};

export const updateSettings = async (req, res) => {
  try {
    const payload = req.body;
    if (Array.isArray(payload)) {
      for (const item of payload) {
        try {
          const type = item.type || (typeof item.value === 'object' ? 'json' : 'text');
          const value = type === 'json'
            ? (typeof item.value === 'string' ? item.value : JSON.stringify(item.value))
            : String(item.value ?? '');
          await SiteSetting.upsert({
            setting_key: item.key,
            setting_value: value,
            setting_type: type
          });
        } catch (err) {}
      }
    } else if (payload && typeof payload === 'object') {
      for (const [key, rawVal] of Object.entries(payload)) {
        try {
          const type = typeof rawVal === 'object' ? 'json' : 'text';
          const value = type === 'json' ? JSON.stringify(rawVal) : String(rawVal ?? '');
          await SiteSetting.upsert({
            setting_key: key,
            setting_value: value,
            setting_type: type
          });
        } catch (err) {}
      }
    }
    res.status(200).json({ success: true, message: 'Settings saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkUpdateSettings = updateSettings;
