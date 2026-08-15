import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const HeroSlide = sequelize.define('HeroSlide', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobile_image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  badge_text: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cta_primary_text: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cta_primary_link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cta_secondary_text: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cta_secondary_link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
});

export default HeroSlide;
