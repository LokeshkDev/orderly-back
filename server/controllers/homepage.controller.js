import db from '../models/index.js';

const { HomepageSection, SiteSetting } = db;

const VIDEO_FILMS_SETTING_KEY = 'video_films';

export const HOMEPAGE_SECTION_DEFAULTS = [
  {
    section_key: 'hero_carousel',
    title: 'Hero Carousel & Trust Bar',
    subtitle: 'PREMIUM MEN\'S WEAR',
    is_visible: true,
    display_order: 1
  },
  {
    section_key: 'shop_by_category',
    title: 'DISCOVER YOUR STYLE',
    subtitle: 'EXPLORE COLLECTIONS',
    is_visible: true,
    display_order: 2
  },
  {
    section_key: 'trending_arrivals',
    title: 'BEST SELLING PRODUCTS',
    subtitle: 'TRENDING NOW',
    is_visible: true,
    display_order: 3
  },
  {
    section_key: 'promo_offers',
    title: 'Promotional Offers Area',
    subtitle: 'Combo offers, 50% Off banner, New arrivals',
    is_visible: true,
    display_order: 4
  },
  {
    section_key: 'lookbook_banner',
    title: 'The Lookbook Editorial',
    subtitle: 'Large luxury editorial campaign banner',
    is_visible: true,
    display_order: 5
  },
  {
    section_key: 'newsletter_section',
    title: 'Newsletter VIP Club',
    subtitle: 'STAY IN THE LOOP',
    is_visible: true,
    display_order: 6
  },
  {
    section_key: 'video_banner',
    title: 'Video Campaign Banner',
    subtitle: 'Homepage video campaign',
    is_visible: false,
    display_order: 7
  },
  {
    section_key: 'shop_by_occasion',
    title: 'Shop By Occasion',
    subtitle: 'Occasion-based shopping',
    is_visible: false,
    display_order: 8
  },
  {
    section_key: 'featured_brands',
    title: 'Catchy Combo Bundles',
    subtitle: 'Curated Multi-Piece Sets',
    is_visible: false,
    display_order: 9
  }
];

let videoFilmsStore = [];

const ensureDefaults = async () => {
  try {
    for (const defSec of HOMEPAGE_SECTION_DEFAULTS) {
      const existing = await HomepageSection.findOne({ where: { section_key: defSec.section_key } });
      if (!existing) {
        await HomepageSection.create(defSec);
      } else {
        // Sync default sections if order was uninitialized or old defaults
        if (defSec.section_key === 'trending_arrivals' && existing.display_order > 3) {
          await existing.update({ display_order: 3 });
        } else if (defSec.section_key === 'video_banner' && existing.display_order <= 3) {
          await existing.update({ display_order: 7, is_visible: false });
        } else if (defSec.section_key === 'shop_by_occasion' && existing.display_order <= 4) {
          await existing.update({ display_order: 8, is_visible: false });
        } else if (defSec.section_key === 'featured_brands' && existing.display_order <= 6) {
          await existing.update({ display_order: 9, is_visible: false });
        }
      }
    }
  } catch (err) {}
};

const serialize = (row) => ({
  id: row.id,
  section_key: row.section_key,
  title: row.title,
  subtitle: row.subtitle,
  is_visible: row.is_visible !== false,
  display_order: row.display_order || 0
});

export const getHomepageSections = async (req, res) => {
  try {
    await ensureDefaults();
    let sections = [];
    try {
      sections = await HomepageSection.findAll({ order: [['display_order', 'ASC']] });
    } catch (err) {}

    if (!sections || sections.length === 0) {
      sections = HOMEPAGE_SECTION_DEFAULTS;
    }
    res.status(200).json({ success: true, data: sections.map(serialize) });
  } catch (error) {
    res.status(200).json({ success: true, data: HOMEPAGE_SECTION_DEFAULTS });
  }
};

export const getAllHomepageSections = getHomepageSections;

export const updateHomepageSections = async (req, res) => {
  try {
    const sectionsArray = req.body;
    if (!Array.isArray(sectionsArray)) {
      return res.status(400).json({ success: false, message: 'Expected an array of sections' });
    }

    for (const item of sectionsArray) {
      try {
        const existing = await HomepageSection.findOne({
          where: { section_key: item.section_key }
        });
        const payload = {
          section_key: item.section_key,
          title: item.title ?? null,
          subtitle: item.subtitle ?? null,
          is_visible: item.is_visible !== false,
          display_order: Number(item.display_order) || 0
        };
        if (existing) {
          await existing.update(payload);
        } else {
          await HomepageSection.create(payload);
        }
      } catch (err) {}
    }

    res.status(200).json({ success: true, message: 'Homepage sections updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVideoFilms = async (req, res) => {
  try {
    const stored = await getStoredVideoFilms();
    res.status(200).json({ success: true, data: stored || [] });
  } catch (error) {
    res.status(200).json({ success: true, data: [] });
  }
};

const getStoredVideoFilms = async () => {
  try {
    const row = await SiteSetting.findOne({ where: { setting_key: VIDEO_FILMS_SETTING_KEY } });
    if (row && row.setting_value) {
      const parsed = JSON.parse(row.setting_value);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {}
  return null;
};

export const updateVideoFilms = async (req, res) => {
  try {
    const items = req.body;
    if (Array.isArray(items)) {
      try {
        await SiteSetting.upsert({
          setting_key: VIDEO_FILMS_SETTING_KEY,
          setting_value: JSON.stringify(items),
          setting_type: 'json'
        });
      } catch (err) {}
      videoFilmsStore = items;
      res.status(200).json({ success: true, data: items });
    } else {
      res.status(400).json({ success: false, message: 'Expected an array of video films' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
