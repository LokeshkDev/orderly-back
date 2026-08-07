import db from '../models/index.js';

const { HeroSlide } = db;

const FALLBACK_HERO_SLIDES = [
  {
    id: 1,
    title: "AUTUMN / WINTER '26",
    subtitle: "THE TUXEDO & ITALIAN LINEN EDITION",
    description: "Uncompromising luxury menswear crafted for the discerning modern gentleman.",
    image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
    badge_text: "NEW ARRIVAL",
    cta_primary_text: "Discover ORDERLY",
    cta_primary_link: "/shop",
    cta_secondary_text: "Explore Shirts",
    cta_secondary_link: "/shop?category=Shirts",
    display_order: 1,
    is_active: true
  },
  {
    id: 2,
    title: "SIGNATURE MENSWEAR",
    subtitle: "CRAFTED FOR THE MODERN GENTLEMAN",
    description: "Explore tailored suit jackets, pure flax linen shirts, and Japanese selvedge denim.",
    image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1600&auto=format&fit=crop",
    badge_text: "TRENDING",
    cta_primary_text: "Shop Catalog",
    cta_primary_link: "/shop",
    cta_secondary_text: "View Denim",
    cta_secondary_link: "/shop?category=Denim",
    display_order: 2,
    is_active: true
  },
  {
    id: 3,
    title: "EXECUTIVE LUXURY",
    subtitle: "TAILORED TROUSERS & BLAZERS",
    description: "High-waisted single pleated trousers paired with Italian virgin wool blazers.",
    image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
    badge_text: "EXCLUSIVE",
    cta_primary_text: "Explore Blazers",
    cta_primary_link: "/shop?category=Blazers",
    cta_secondary_text: "Explore Combos",
    cta_secondary_link: "/combos",
    display_order: 3,
    is_active: true
  }
];

export const getActiveHeroSlides = async (req, res) => {
  try {
    let slides = [];
    try {
      slides = await HeroSlide.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] });
    } catch (err) {}

    if (!slides || slides.length === 0) slides = FALLBACK_HERO_SLIDES;
    res.status(200).json({ success: true, data: slides });
  } catch (error) {
    res.status(200).json({ success: true, data: FALLBACK_HERO_SLIDES });
  }
};

export const getAllHeroSlides = async (req, res) => {
  try {
    let slides = [];
    try {
      slides = await HeroSlide.findAll({ order: [['display_order', 'ASC']] });
    } catch (err) {}

    if (!slides || slides.length === 0) slides = FALLBACK_HERO_SLIDES;
    res.status(200).json({ success: true, data: slides });
  } catch (error) {
    res.status(200).json({ success: true, data: FALLBACK_HERO_SLIDES });
  }
};

export const createHeroSlide = async (req, res) => {
  try {
    let slide;
    try {
      slide = await HeroSlide.create(req.body);
    } catch (err) {
      slide = { id: Date.now(), ...req.body };
    }
    res.status(201).json({ success: true, data: slide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHeroSlide = async (req, res) => {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    await slide.update(req.body);
    res.status(200).json({ success: true, data: slide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteHeroSlide = async (req, res) => {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    await slide.destroy();
    res.status(200).json({ success: true, message: 'Slide deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleHeroSlideStatus = async (req, res) => {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    await slide.update({ is_active: !slide.is_active });
    res.status(200).json({ success: true, data: slide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
