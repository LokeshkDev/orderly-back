import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SiteSetting = sequelize.define('SiteSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  setting_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'uq_sitesettings_setting_key',
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  setting_type: {
    type: DataTypes.ENUM('text', 'image', 'json', 'boolean'),
    allowNull: false,
    defaultValue: 'text',
  }
}, {
  timestamps: false,
});

export default SiteSetting;
