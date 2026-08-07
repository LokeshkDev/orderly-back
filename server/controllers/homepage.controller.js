import db from '../models/index.js';

const { HomepageSection, SiteSetting } = db;

const VIDEO_FILMS_SETTING_KEY = 'video_films';

export const HOMEPAGE_SECTION_DEFAULTS = [
  {
    section_key: 'hero_carousel',
    title: 'Hero Carousel',
    subtitle: 'Homepage hero banner',
    is_visible: true,
    display_order: 1
  },
  {
    section_key: 'shop_by_category',
    title: 'Shop By Category',
    subtitle: 'EXPLORE APPAREL',
    is_visible: true,
    display_order: 2
  },
  {
    section_key: 'video_banner',
    title: 'Video Campaign Banner',
    subtitle: 'Homepage video campaign',
    is_visible: true,
    display_order: 3
  },
  {
    section_key: 'shop_by_occasion',
    title: 'Shop By Occasion',
    subtitle: 'Occasion-based shopping',
    is_visible: true,
    display_order: 4
  },
  {
    section_key: 'trending_arrivals',
    title: 'Trending & New Arrivals',
    subtitle: 'HANDPICKED CURATION',
    is_visible: true,
    display_order: 5
  },
  {
    section_key: 'featured_brands',
    title: 'Featured Brands',
    subtitle: 'Curated In-House Houses',
    is_visible: true,
    display_order: 6
  }
];

let videoFilmsStore = [];

const ensureDefaults = async () => {
  try {
    const count = await HomepageSection.count();
    if (count === 0) {
      await HomepageSection.bulkCreate(HOMEPAGE_SECTION_DEFAULTS);
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
