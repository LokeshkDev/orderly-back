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

export const DEFAULT_CMS_PAGES = {
  about: {
    title: 'About Us',
    subtitle: 'Our Heritage & Vision',
    banner_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1920&auto=format&fit=crop',
    featured_image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    content_html: `<h2>Craftsmanship Without Compromise</h2><p>Founded with a mission to eliminate low-grade template clothing, ORDERLY Mens Wear crafts bespoke menswear that commands respect. From Italian flax linen tuxedo shirts to heavy streetwear tees and synchronized father-son heritage sets, every piece undergoes rigorous quality testing.</p><p>Inspired by the aesthetic codes of Zara, Rare Rabbit, and H&M Premium, our garments offer tailored precision, contemporary silhouettes, and timeless sophistication.</p><h3>Our Core Pillars</h3><ul><li><strong>Pure Luxury Fabrics:</strong> Ethically sourced organic linens, Supima cottons, and fine wool blends.</li><li><strong>Artisanal Tailoring:</strong> Structured cuts with handcrafted attention to cuffs, collars, and seams.</li><li><strong>Modern Elegance:</strong> Designs created for the discerning gentleman who values subtle distinction.</li></ul>`
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'We Are Here To Assist You',
    banner_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop',
    featured_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    content_html: `<h2>Concierge & Customer Support</h2><p>Whether you have an inquiry regarding custom sizing, an existing shipment, corporate bulk gifting, or bespoke styling, our dedicated concierge team is available to assist you.</p><h3>Headquarters & Showroom</h3><p><strong>ORDERLY 2.0</strong><br>Valasaravakkam, Kundrathur, Chennai, Tamil Nadu, India.</p><p><strong>Phone:</strong> +91 98765 43210 (Monday to Saturday, 10:00 AM – 7:00 PM IST)<br><strong>Email:</strong> info@orderlymenswear.com<br><strong>WhatsApp VIP Support:</strong> +91 98765 43210</p>`
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Commitment To Protecting Your Personal Data',
    banner_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop',
    featured_image: '',
    content_html: `<h2>Your Privacy Matters</h2><p>At ORDERLY, we treat personal data with supreme discretion. This Privacy Policy outlines how your personal information is gathered, utilized, and safeguarded when you visit or transact on orderlymenswear.com.</p><h3>1. Information We Collect</h3><p>When you browse or place an order, we collect essential identifiers including your name, shipping address, contact phone number, email address, and encrypted payment tokenization details.</p><h3>2. How We Use Your Data</h3><ul><li>To process, dispatch, and track your sartorial orders.</li><li>To communicate live shipment milestones and transactional notifications.</li><li>To offer tailored size recommendations and exclusive VIP previews (upon consent).</li></ul><h3>3. Data Protection & Security</h3><p>We implement end-to-end 256-bit SSL encryption and partner solely with PCI-DSS compliant banking gateways. We never sell or lease your personal credentials to third-party marketing entities.</p>`
  },
  policy: {
    title: 'Shipping & Returns Policy',
    subtitle: 'Seamless Delivery & Doorstep Exchanges',
    banner_image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1920&auto=format&fit=crop',
    featured_image: '',
    content_html: `<h2>Shipping & Delivery Terms</h2><p>We offer complimentary express shipping across India on orders exceeding ₹2,500. Orders below ₹2,500 incur a flat express shipping fee of ₹199.</p><ul><li><strong>Dispatch Window:</strong> All orders are prepared and dispatched within 24 business hours.</li><li><strong>Metro Deliveries:</strong> Delivered within 48 to 72 hours.</li><li><strong>Non-Metro Deliveries:</strong> Delivered within 3 to 5 business days.</li></ul><h2>15-Day Doorstep Returns & Exchanges</h2><p>If you are not completely enchanted by the fit or finish of your ORDERLY piece, you may request a hassle-free doorstep return or size exchange within 15 days of parcel receipt.</p><ul><li>Garments must remain unworn, unwashed, and intact with all security tags and original luxury packaging box.</li><li>Refunds are initiated instantly to your original payment mode or store credits once quality inspection is completed.</li></ul>`
  },
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'User Agreement & Sizing Guidelines',
    banner_image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=1920&auto=format&fit=crop',
    featured_image: '',
    content_html: `<h2>Terms of Service</h2><p>Welcome to ORDERLY. By browsing our boutique, accessing our digital catalog, or placing an order, you agree to be bound by these Terms and Conditions.</p><h3>1. Product Accuracy & Sizing</h3><p>We take meticulous care in representing garments with accurate colors, texture fidelity, and sizing dimensions. Slight variances in natural linen grain or screen calibration may occur.</p><h3>2. Pricing & Payments</h3><p>All prices displayed on our website are inclusive of applicable GST taxes in Indian Rupees (INR). We reserve the right to revise pricing or rectify typographical discrepancies at any moment prior to confirmation.</p><h3>3. Intellectual Property</h3><p>All imagery, styling designs, brand marks, and digital assets are the exclusive intellectual property of ORDERLY Mens Wear. Unauthorized reproduction or commercial distribution is strictly prohibited.</p>`
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
        { id: 'link-3-4', label: 'Privacy Policy', url: '/privacy-policy' },
        { id: 'link-3-5', label: 'Terms & Conditions', url: '/terms-and-conditions' }
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
  cms_pages: DEFAULT_CMS_PAGES,
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
