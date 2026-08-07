import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Combo = sequelize.define('Combo', {
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
    unique: 'uq_combos_slug'
  },
  pieces_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2
  },
  offer_price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  original_price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  badge: {
    type: DataTypes.STRING,
    defaultValue: 'SPECIAL COMBO'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active'
  },
  description: {
    type: DataTypes.TEXT
  },
  images: {
    type: DataTypes.JSON
  },
  is_existing_products_combo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  items: {
    type: DataTypes.JSON
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

export default Combo;
