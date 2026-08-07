import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { 
  sequelize, 
  Admin, 
  Category, 
  Occasion, 
  Brand, 
  HeroSlide, 
  SiteSetting,
  Product
} from '../models/index.js';

dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Starting ORDERLY Database Seeder...');

    // Sync tables
    await sequelize.sync({ force: true });
    console.log('✅ Database tables reset and recreated');

    // 1. Admin Account
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@orderly.com',
      password_hash: hashedPassword,
      role: 'admin',
      is_active: true
    });
    console.log('✅ Admin user created (admin@orderly.com / admin123)');

    // 2. Categories (5 main departments)
    const categoriesData = [
      { id: 1, name: 'Tops & T-Shirts', slug: 'tops-tshirts', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop', display_order: 1 },
      { id: 2, name: 'Shirts', slug: 'shirts', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop', display_order: 2 },
      { id: 3, name: 'Denim', slug: 'denim', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop', display_order: 3 },
      { id: 4, name: 'Trousers', slug: 'trousers', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=800&auto=format&fit=crop', display_order: 4 },
      { id: 5, name: 'Blazers', slug: 'blazers', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop', display_order: 5 }
    ];
    await Category.bulkCreate(categoriesData);
    console.log('✅ 5 Categories seeded');

    // 3. 10 Dummy Menswear Products across 5 Categories
    const productsData = [
      // Category 1: Tops & T-Shirts
      {
        id: 'prod-001',
        name: 'Essential Heavyweight Cotton Crewneck Tee',
        slug: 'essential-cotton-crewneck',
        sku: 'TS-ESS-001',
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
        description: 'A premium, heavyweight 240 GSM organic cotton crewneck t-shirt designed for everyday effortless style.',
        specifications: [
          { label: 'Fabric', value: '100% Super Combed Cotton (240 GSM)' },
          { label: 'Fit', value: 'Relaxed Fit' }
        ],
        tags: ['Essentials', 'Cotton', 'Summer'],
        colors: [
          { name: 'Onyx Black', hex: '#0B0B0B', images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'] },
          { name: 'Pure White', hex: '#FFFFFF', images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Onyx Black-S': 15, 'Onyx Black-M': 24, 'Pure White-S': 12, 'Pure White-M': 18 }
      },
      {
        id: 'prod-004',
        name: 'Acid Wash Oversized Graphic Tee',
        slug: 'acid-wash-oversized-tee',
        sku: 'TS-OVR-004',
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
        description: 'Drop-shoulder relaxed street fit with hand-distressed acid wash treatment and high-density typography print.',
        specifications: [
          { label: 'Fabric', value: '280 GSM French Terry Cotton' },
          { label: 'Fit', value: 'Boxy Oversized Cut' }
        ],
        tags: ['Streetwear', 'Graphic Tee', 'Acid Wash'],
        colors: [
          { name: 'Acid Black', hex: '#1A1A1A', images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Acid Black-S': 12, 'Acid Black-M': 20, 'Acid Black-L': 19 }
      },

      // Category 2: Shirts
      {
        id: 'prod-002',
        name: 'Structured European Linen Resort Shirt',
        slug: 'structured-linen-resort-shirt',
        sku: 'SH-LIN-002',
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
        description: 'Breathe sophistication into your warm-weather wardrobe with our pure European flax linen shirt.',
        specifications: [
          { label: 'Fabric', value: '100% Normandy Linen' },
          { label: 'Collar', value: 'Camp / Cuban Collar' }
        ],
        tags: ['Linen', 'Summer', 'Resort Wear'],
        colors: [
          { name: 'Olive Tan', hex: '#556B2F', images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop'] },
          { name: 'Sky Blue', hex: '#87CEEB', images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['M', 'L', 'XL', 'XXL'],
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Olive Tan-M': 10, 'Olive Tan-L': 14, 'Sky Blue-M': 8 }
      },
      {
        id: 'prod-008',
        name: 'Supima Cotton Classic Knit Polo Shirt',
        slug: 'supima-cotton-polo-shirt',
        sku: 'PL-PMA-008',
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
        description: 'Refined short-sleeve polo knit from long-staple Supima cotton pique.',
        specifications: [
          { label: 'Fabric', value: '100% Supima Cotton Pique' }
        ],
        tags: ['Polo', 'Supima', 'Smart Casual'],
        colors: [
          { name: 'Royal Navy', hex: '#0B2545', images: ['https://images.unsplash.com/photo-1625910513413-882155677b10?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        images: ['https://images.unsplash.com/photo-1625910513413-882155677b10?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Royal Navy-S': 14, 'Royal Navy-M': 22 }
      },

      // Category 3: Denim
      {
        id: 'prod-003',
        name: '14oz Japanese Selvedge Slim Tapered Denim',
        slug: 'japanese-selvedge-tapered-denim',
        sku: 'DN-SEL-003',
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
        description: 'Crafted on vintage shuttle looms in Okayama, Japan. 14oz raw selvedge denim featuring custom brass hardware.',
        specifications: [
          { label: 'Weight', value: '14oz Kurabo Mills Raw Selvedge' },
          { label: 'Fit', value: 'Slim Tapered Cut' }
        ],
        tags: ['Denim', 'Selvedge', 'Japanese'],
        colors: [
          { name: 'Indigo Raw', hex: '#1F2937', images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['30', '32', '34', '36'],
        images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Indigo Raw-30': 7, 'Indigo Raw-32': 15 }
      },
      {
        id: 'prod-009',
        name: 'Vintage Wash Slim Distressed Denim',
        slug: 'vintage-wash-slim-denim',
        sku: 'DN-VNT-009',
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
        description: 'Hand-washed medium indigo denim with subtle whiskering and distressed knee detailing.',
        specifications: [
          { label: 'Material', value: '98% Cotton, 2% Stretch Elastane' }
        ],
        tags: ['Denim', 'Vintage', 'Washed'],
        colors: [
          { name: 'Washed Blue', hex: '#3B82F6', images: ['https://images.unsplash.com/photo-1542272604-780c36856842?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['30', '32', '34'],
        images: ['https://images.unsplash.com/photo-1542272604-780c36856842?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Washed Blue-30': 10, 'Washed Blue-32': 14 }
      },

      // Category 4: Trousers
      {
        id: 'prod-006',
        name: 'Single-Pleated Tailored Smart Trousers',
        slug: 'pleated-tailored-trousers',
        sku: 'TR-PLT-006',
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
        tags: ['Trousers', 'Smart Casual', 'Pleated'],
        colors: [
          { name: 'Charcoal Grey', hex: '#333333', images: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['30', '32', '34', '36'],
        images: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Charcoal Grey-30': 11, 'Charcoal Grey-32': 18 }
      },
      {
        id: 'prod-010',
        name: 'Italian Chino Stretch Slim Trousers',
        slug: 'italian-chino-slim-trousers',
        sku: 'TR-CHN-010',
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
        description: 'Crafted from stretch cotton twill for exceptional comfort from boardroom to dinner.',
        specifications: [
          { label: 'Fabric', value: '97% Cotton, 3% Spandex' }
        ],
        tags: ['Chino', 'Trousers', 'Office Wear'],
        colors: [
          { name: 'Khaki Beige', hex: '#C2B280', images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['30', '32', '34', '36'],
        images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Khaki Beige-30': 15, 'Khaki Beige-32': 20 }
      },

      // Category 5: Blazers
      {
        id: 'prod-005',
        name: 'Italian Merino Wool Double-Breasted Blazer',
        slug: 'wool-blend-double-breasted-blazer',
        sku: 'BL-WOL-005',
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
          { label: 'Lining', value: '100% Cupro Silk' }
        ],
        tags: ['Luxury', 'Blazer', 'Tailored'],
        colors: [
          { name: 'Midnight Navy', hex: '#0A192F', images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['38R', '40R', '42R', '44R'],
        images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Midnight Navy-38R': 4, 'Midnight Navy-40R': 8 }
      },
      {
        id: 'prod-007',
        name: 'Velvet Evening Dinner Suit Blazer',
        slug: 'velvet-evening-dinner-blazer',
        sku: 'BL-VLV-007',
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
        tags: ['Blazer', 'Velvet', 'Dinner Jacket'],
        colors: [
          { name: 'Deep Crimson', hex: '#800020', images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop'] }
        ],
        sizes: ['38R', '40R', '42R'],
        images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop'],
        inventory: { 'Deep Crimson-38R': 5, 'Deep Crimson-40R': 7 }
      }
    ];

    await Product.bulkCreate(productsData);
    console.log('✅ 10 Products across 5 Categories seeded to Database');

    // 4. Occasions
    const occasionsData = [
      { id: 1, name: 'Office Wear', slug: 'office', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop', subtitle: 'Sharp & Professional' },
      { id: 2, name: 'Casual Wear', slug: 'casual', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=800&auto=format&fit=crop', subtitle: 'Effortless Everyday' },
      { id: 3, name: 'Party Wear', slug: 'party', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop', subtitle: 'Bold & High Fashion' },
      { id: 4, name: 'Wedding Wear', slug: 'wedding', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop', subtitle: 'Regal Excellence' },
      { id: 5, name: 'Festive Wear', slug: 'festive', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop', subtitle: 'Traditional Elegance' },
      { id: 6, name: 'Travel Wear', slug: 'travel', image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=800&auto=format&fit=crop', subtitle: 'Relaxed Mobility' }
    ];
    await Occasion.bulkCreate(occasionsData);
    console.log('✅ Occasions seeded');

    // 5. Brands
    const brandsData = [
      { id: 1, name: 'ORDERLY STUDIO', slug: 'orderly-studio', logo_text: 'STUDIO' },
      { id: 2, name: 'ROYAL OAK', slug: 'royal-oak', logo_text: 'ROYAL OAK' },
      { id: 3, name: 'ORDERLY DENIM', slug: 'orderly-denim', logo_text: 'DENIM' },
      { id: 4, name: 'ORDERLY LABS', slug: 'orderly-labs', logo_text: 'LABS' }
    ];
    await Brand.bulkCreate(brandsData);
    console.log('✅ Brands seeded');

    // 6. Hero Slides
    const heroSlidesData = [
      {
        title: "AUTUMN / WINTER '26",
        subtitle: "THE TUXEDO & ITALIAN LINEN EDITION",
        description: "Uncompromising luxury menswear crafted for the discerning modern gentleman.",
        image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
        badge_text: "NEW ARRIVAL",
        cta_primary_text: "Discover ORDERLY",
        cta_primary_link: "/shop",
        cta_secondary_text: "Explore Shirts",
        cta_secondary_link: "/shop?category=Shirts",
        display_order: 1
      },
      {
        title: "SIGNATURE COLLECTION",
        subtitle: "CRAFTED FOR THE MODERN GENTLEMAN",
        description: "Bespoke luxury menswear designed for every occasion.",
        image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1600&auto=format&fit=crop",
        badge_text: "TRENDING",
        cta_primary_text: "Shop Catalog",
        cta_primary_link: "/shop",
        cta_secondary_text: "View Denim",
        cta_secondary_link: "/shop?category=Denim",
        display_order: 2
      }
    ];
    await HeroSlide.bulkCreate(heroSlidesData);
    console.log('✅ Hero slides seeded');

    // 7. Site Settings
    const settings = [
      { setting_key: 'store_name', setting_value: 'ORDERLY Mens Wear', setting_type: 'text' },
      { setting_key: 'cod_enabled', setting_value: 'true', setting_type: 'boolean' }
    ];
    await SiteSetting.bulkCreate(settings);
    console.log('✅ Site settings seeded');

    console.log('🎉 ORDERLY Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
