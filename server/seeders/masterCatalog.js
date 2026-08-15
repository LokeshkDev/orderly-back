// ORDERLY Master Catalog — server-side seed data.
// This is the initial catalog used to populate an empty database.
// Once seeded, the MySQL database is the single source of truth:
// every edit made in the Admin panel is what the website displays.

export const MASTER_PRODUCTS = [
  {
    id: 'prod-001',
    slug: 'essential-cotton-crewneck',
    sku: 'TS-ESS-001',
    name: 'Essential Heavyweight Cotton Crewneck Tee',
    brand: 'ORDERLY STUDIO',
    category: 'Tops & T-Shirts',
    occasion: 'Casual Wear',
    price: 1499,
    originalPrice: 2499,
    rating: 4.8,
    reviewsCount: 142,
    badge: 'BESTSELLER',
    vendor: 'In-House Standard',
    status: 'Active',
    description: 'A premium, heavyweight 240 GSM organic cotton crewneck t-shirt designed for everyday effortless style. Features a relaxed fit, ribbed collar, and double-needle stitching for long-lasting durability.',
    specifications: [
      { label: 'Fabric', value: '100% Super Combed Organic Cotton (240 GSM)' },
      { label: 'Fit', value: 'Relaxed Fit' },
      { label: 'Neck', value: 'Ribbed Crewneck' },
      { label: 'Care Instructions', value: 'Machine wash cold with like colors' }
    ],
    tags: ['Essentials', 'Summer', 'Cotton', 'Bestseller'],
    colors: [
      {
        name: 'Onyx Black',
        hex: '#0B0B0B',
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop']
      },
      {
        name: 'Pure White',
        hex: '#FFFFFF',
        images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'],
    inventory: {
      'Onyx Black-S': 15, 'Onyx Black-M': 24, 'Onyx Black-L': 0, 'Onyx Black-XL': 0, 'Onyx Black-XXL': 10,
      'Pure White-S': 12, 'Pure White-M': 0, 'Pure White-L': 0, 'Pure White-XL': 0, 'Pure White-XXL': 10
    }
  },

  {
    id: 'prod-004',
    slug: 'oversized-streetwear-graphic-tee',
    sku: 'TS-OVR-004',
    name: 'Acid Wash Oversized Graphic Tee',
    brand: 'ORDERLY LABS',
    category: 'Tops & T-Shirts',
    occasion: 'Casual Wear',
    price: 1899,
    originalPrice: 2999,
    rating: 4.6,
    reviewsCount: 215,
    badge: 'HOT',
    vendor: 'Orderly Labs',
    status: 'Active',
    description: 'Drop-shoulder relaxed street fit with hand-distressed acid wash treatment and high-density puffed typography print on front and back.',
    specifications: [
      { label: 'Fabric', value: '280 GSM French Terry Cotton' },
      { label: 'Fit', value: 'Boxy Oversized Street Cut' },
      { label: 'Print', value: 'High Density Screen Print' }
    ],
    tags: ['Streetwear', 'Graphic Tee', 'Acid Wash', 'Oversized'],
    colors: [
      {
        name: 'Acid Black',
        hex: '#1A1A1A',
        images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop'],
    inventory: { 'Acid Black-S': 12, 'Acid Black-M': 20, 'Acid Black-L': 19, 'Acid Black-XL': 10 }
  },

  {
    id: 'prod-002',
    slug: 'structured-linen-resort-shirt',
    sku: 'SH-LIN-002',
    name: 'Structured European Linen Resort Shirt',
    brand: 'ROYAL OAK',
    category: 'Shirts',
    occasion: 'Resort Wear',
    price: 3299,
    originalPrice: 4999,
    rating: 4.9,
    reviewsCount: 98,
    badge: 'NEW',
    vendor: 'Royal Oak Atelier',
    status: 'Active',
    description: 'Breathe sophistication into your warm-weather wardrobe with our pure European flax linen shirt. Tailored with a relaxed camp collar and mother-of-pearl buttons.',
    specifications: [
      { label: 'Fabric', value: '100% Normandy Linen' },
      { label: 'Fit', value: 'Modern Resort Fit' },
      { label: 'Collar', value: 'Camp / Cuban Collar' }
    ],
    tags: ['Linen', 'Summer', 'Resort Wear', 'Luxury'],
    colors: [
      {
        name: 'Olive Tan',
        hex: '#556B2F',
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop']
      },
      {
        name: 'Sky Blue',
        hex: '#87CEEB',
        images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop'],
    inventory: { 'Olive Tan-M': 10, 'Olive Tan-L': 14, 'Sky Blue-M': 8, 'Sky Blue-L': 10 }
  },

  {
    id: 'prod-008',
    slug: 'pima-cotton-pique-polo',
    sku: 'PL-PMA-008',
    name: 'Supima Cotton Classic Knit Polo Shirt',
    brand: 'ORDERLY STUDIO',
    category: 'Shirts',
    occasion: 'Casual Wear',
    price: 2199,
    originalPrice: 3299,
    rating: 4.7,
    reviewsCount: 112,
    badge: 'CLASSIC',
    vendor: 'In-House Standard',
    status: 'Active',
    description: 'Refined short-sleeve polo knit from long-staple Supima cotton pique. Finished with a tailored ribbed collar and custom branded buttons.',
    specifications: [
      { label: 'Fabric', value: '100% American Supima Cotton Pique' },
      { label: 'Fit', value: 'Custom Slim Fit' }
    ],
    tags: ['Polo', 'Supima', 'Smart Casual', 'Essentials'],
    colors: [
      {
        name: 'Royal Navy',
        hex: '#0B2545',
        images: ['https://images.unsplash.com/photo-1625910513413-882155677b10?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['https://images.unsplash.com/photo-1625910513413-882155677b10?q=80&w=1000&auto=format&fit=crop'],
    inventory: { 'Royal Navy-S': 14, 'Royal Navy-M': 22, 'Royal Navy-L': 10 }
  },

  {
    id: 'prod-003',
    slug: 'japanese-selvedge-tapered-denim',
    sku: 'DN-SEL-003',
    name: '14oz Japanese Selvedge Slim Tapered Denim',
    brand: 'ORDERLY DENIM',
    category: 'Denim',
    occasion: 'Nightout & Parties',
    price: 4499,
    originalPrice: 6999,
    rating: 4.7,
    reviewsCount: 86,
    badge: 'TRENDING',
    vendor: 'Osaka Mills Co',
    status: 'Active',
    description: 'Crafted on vintage shuttle looms in Okayama, Japan. 14oz raw selvedge denim featuring custom brass hardware and chain-stitched hems.',
    specifications: [
      { label: 'Denim Weight', value: '14oz Kurabo Mills Raw Selvedge' },
      { label: 'Fit', value: 'Slim Tapered Cut' }
    ],
    tags: ['Denim', 'Selvedge', 'Japanese', 'Raw'],
    colors: [
      {
        name: 'Indigo Raw',
        hex: '#1F2937',
        images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['30', '32', '34', '36'],
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'],
    inventory: { 'Indigo Raw-30': 7, 'Indigo Raw-32': 15, 'Indigo Raw-34': 10 }
  },

  {
    id: 'prod-009',
    slug: 'vintage-wash-slim-denim',
    sku: 'DN-VNT-009',
    name: 'Vintage Wash Slim Distressed Denim',
    brand: 'ORDERLY DENIM',
    category: 'Denim',
    occasion: 'Casual Wear',
    price: 3899,
    originalPrice: 5499,
    rating: 4.65,
    reviewsCount: 74,
    badge: 'TRENDING',
    vendor: 'Osaka Mills Co',
    status: 'Active',
    description: 'Hand-washed medium indigo denim with subtle whiskering and distressed knee detailing for effortless edge.',
    specifications: [
      { label: 'Material', value: '98% Cotton, 2% Stretch Elastane' }
    ],
    tags: ['Denim', 'Vintage', 'Washed'],
    colors: [
      {
        name: 'Washed Blue',
        hex: '#3B82F6',
        images: ['https://images.unsplash.com/photo-1542272604-780c36856842?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['30', '32', '34'],
    images: ['https://images.unsplash.com/photo-1542272604-780c36856842?q=80&w=1000&auto=format&fit=crop'],
    inventory: { 'Washed Blue-30': 10, 'Washed Blue-32': 14 }
  },

  {
    id: 'prod-006',
    slug: 'pleated-tailored-trousers',
    sku: 'TR-PLT-006',
    name: 'Single-Pleated Tailored Smart Trousers',
    brand: 'ORDERLY STUDIO',
    category: 'Trousers',
    occasion: 'Office Wear',
    price: 2799,
    originalPrice: 3999,
    rating: 4.75,
    reviewsCount: 78,
    badge: 'POPULAR',
    vendor: 'In-House Standard',
    status: 'Active',
    description: 'High-waisted tailored trousers with front single pleats, side adjusters, and a clean sharp taper line.',
    specifications: [
      { label: 'Fabric', value: '65% Viscose, 30% Polyester, 5% Elastane' },
      { label: 'Fit', value: 'High-Waist Tapered Fit' }
    ],
    tags: ['Trousers', 'Smart Casual', 'Pleated', 'Formal'],
    colors: [
      {
        name: 'Charcoal Grey',
        hex: '#333333',
        images: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['30', '32', '34', '36'],
    images: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1000&auto=format&fit=crop'],
    inventory: { 'Charcoal Grey-30': 11, 'Charcoal Grey-32': 18 }
  },

  {
    id: 'prod-010',
    slug: 'italian-chino-slim-trousers',
    sku: 'TR-CHN-010',
    name: 'Italian Chino Stretch Slim Trousers',
    brand: 'ORDERLY STUDIO',
    category: 'Trousers',
    occasion: 'Office Wear',
    price: 2999,
    originalPrice: 4299,
    rating: 4.8,
    reviewsCount: 92,
    badge: 'BESTSELLER',
    vendor: 'In-House Standard',
    status: 'Active',
    description: 'Crafted from stretch cotton twill for exceptional comfort from boardroom to evening dinner.',
    specifications: [
      { label: 'Fabric', value: '97% Cotton, 3% Spandex' }
    ],
    tags: ['Chino', 'Trousers', 'Office Wear'],
    colors: [
      {
        name: 'Khaki Beige',
        hex: '#C2B280',
        images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['30', '32', '34', '36'],
    images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop'],
    inventory: { 'Khaki Beige-30': 15, 'Khaki Beige-32': 20 }
  },

  {
    id: 'prod-005',
    slug: 'wool-blend-double-breasted-blazer',
    sku: 'BL-WOL-005',
    name: 'Italian Merino Wool Double-Breasted Blazer',
    brand: 'ROYAL OAK',
    category: 'Blazers',
    occasion: 'Wedding Wear',
    price: 8999,
    originalPrice: 12999,
    rating: 4.95,
    reviewsCount: 64,
    badge: 'LUXURY',
    vendor: 'Milano Tailors',
    status: 'Active',
    description: 'Impeccably tailored double-breasted suit jacket crafted in Italy from 100% Super 120s virgin merino wool.',
    specifications: [
      { label: 'Material', value: '100% Super 120s Italian Merino Wool' },
      { label: 'Lining', value: '100% Bemberg Cupro Silk' }
    ],
    tags: ['Luxury', 'Blazer', 'Tailored', 'Formal'],
    colors: [
      {
        name: 'Midnight Navy',
        hex: '#0A192F',
        images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['38R', '40R', '42R', '44R'],
    images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop'],
    inventory: { 'Midnight Navy-38R': 4, 'Midnight Navy-40R': 8 }
  },

  {
    id: 'prod-007',
    slug: 'velvet-evening-dinner-blazer',
    sku: 'BL-VLV-007',
    name: 'Velvet Evening Dinner Suit Blazer',
    brand: 'ROYAL OAK',
    category: 'Blazers',
    occasion: 'Party Wear',
    price: 9499,
    originalPrice: 13999,
    rating: 4.9,
    reviewsCount: 52,
    badge: 'EXCLUSIVE',
    vendor: 'Milano Tailors',
    status: 'Active',
    description: 'Rich cotton velvet dinner jacket featuring satin shawl lapels and silk-covered buttons.',
    specifications: [
      { label: 'Fabric', value: '100% Cotton Velvet with Satin Lapel' }
    ],
    tags: ['Blazer', 'Velvet', 'Dinner Jacket', 'Evening'],
    colors: [
      {
        name: 'Deep Crimson',
        hex: '#800020',
        images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop']
      }
    ],
    sizes: ['38R', '40R', '42R'],
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop'],
    inventory: { 'Deep Crimson-38R': 5, 'Deep Crimson-40R': 7 }
  }
];

export const MASTER_COMBOS = [
  {
    id: 'combo-001',
    name: 'Resort Luxe 2-Piece Linen & Selvedge Denim Set',
    slug: 'resort-luxe-2-piece-linen-selvedge-denim-set',
    pieces_count: 2,
    offer_price: 5499,
    original_price: 7798,
    badge: 'SAVE ₹2,299',
    status: 'Active',
    category: 'Casual Weekend Sets',
    category_slug: 'casual-combos',
    description: 'Curated 2-piece luxury ensemble pairing our European Linen Resort Shirt with Japanese Selvedge Raw Denim.',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'
    ],
    is_existing_products_combo: true,
    items: [
      {
        pieceIndex: 1,
        pieceLabel: 'Piece 1: Structured European Linen Resort Shirt',
        productId: 'prod-002',
        name: 'Structured European Linen Resort Shirt',
        colors: [
          { name: 'Olive Tan', hex: '#556B2F', images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop'] },
          { name: 'Sky Blue', hex: '#87CEEB', images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['M', 'L', 'XL', 'XXL']
      },
      {
        pieceIndex: 2,
        pieceLabel: 'Piece 2: 14oz Japanese Selvedge Slim Tapered Denim',
        productId: 'prod-003',
        name: '14oz Japanese Selvedge Slim Tapered Denim',
        colors: [
          { name: 'Indigo Raw', hex: '#1F2937', images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    id: 'combo-002',
    name: 'Executive 3-Piece Italian Suit & Polo Box',
    slug: 'executive-3-piece-italian-suit-polo-box',
    pieces_count: 3,
    offer_price: 9999,
    original_price: 13997,
    badge: 'LUXURY BUNDLE',
    status: 'Active',
    category: 'Executive & Formal Combos',
    category_slug: 'formal-combos',
    description: '3-piece executive luxury capsule featuring an Italian Wool Double-Breasted Suit Blazer, Normandy Linen Shirt, and Heavyweight Cotton Tee.',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'
    ],
    is_existing_products_combo: true,
    items: [
      {
        pieceIndex: 1,
        pieceLabel: 'Piece 1: Italian Merino Wool Double-Breasted Blazer',
        productId: 'prod-005',
        name: 'Italian Merino Wool Double-Breasted Blazer',
        colors: [
          { name: 'Midnight Navy', hex: '#0A192F', images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['38R', '40R', '42R', '44R']
      },
      {
        pieceIndex: 2,
        pieceLabel: 'Piece 2: Structured European Linen Resort Shirt',
        productId: 'prod-002',
        name: 'Structured European Linen Resort Shirt',
        colors: [
          { name: 'Olive Tan', hex: '#556B2F', images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['M', 'L', 'XL']
      },
      {
        pieceIndex: 3,
        pieceLabel: 'Piece 3: Essential Heavyweight Cotton Crewneck Tee',
        productId: 'prod-001',
        name: 'Essential Heavyweight Cotton Crewneck Tee',
        colors: [
          { name: 'Onyx Black', hex: '#0B0B0B', images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['S', 'M', 'L', 'XL']
      }
    ]
  }
];
