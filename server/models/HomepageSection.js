import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const HomepageSection = sequelize.define('HomepageSection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  section_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'uq_homepagesections_section_key',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  timestamps: true,
});

export default HomepageSection;
