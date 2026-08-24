import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'uq_products_slug'
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    defaultValue: 'ORDERLY STUDIO'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  occasion: {
    type: DataTypes.STRING
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  originalPrice: {
    type: DataTypes.FLOAT
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 4.8
  },
  reviewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  badge: {
    type: DataTypes.STRING
  },
  vendor: {
    type: DataTypes.STRING,
    defaultValue: 'In-House Standard'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active'
  },
  description: {
    type: DataTypes.TEXT
  },
  specifications: {
    type: DataTypes.JSON
  },
  tags: {
    type: DataTypes.JSON
  },
  colors: {
    type: DataTypes.JSON
  },
  sizes: {
    type: DataTypes.JSON
  },
  images: {
    type: DataTypes.JSON
  },
  inventory: {
    type: DataTypes.JSON
  },
  sizePrices: {
    type: DataTypes.JSON,
    comment: 'Size-wise pricing override, keyed by size label'
  },
  sizeOriginalPrices: {
    type: DataTypes.JSON,
    comment: 'Size-wise original compare pricing override, keyed by size label'
  },
  suggested_products: {
    type: DataTypes.JSON,
    comment: 'Array of product IDs shown in the PDP "Pairs Well With" section (admin-managed)'
  },
  pair_offers: {
    type: DataTypes.JSON,
    comment: 'Offer setup keyed by paired product ID for PDP "Pairs Well With" products'
  },
  metaTitle: {
    type: DataTypes.STRING,
    comment: 'SEO meta title'
  },
  metaDescription: {
    type: DataTypes.TEXT,
    comment: 'SEO meta description'
  },
  metaKeywords: {
    type: DataTypes.TEXT,
    comment: 'SEO meta keywords comma-separated'
  },
  last_updated_by: {
    type: DataTypes.STRING,
    defaultValue: 'Super Admin',
    comment: 'Admin user who last modified this record'
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

export default Product;
