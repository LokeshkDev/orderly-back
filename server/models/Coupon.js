import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'uq_coupons_code',
  },
  discount_type: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false,
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  min_order: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  max_discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  used_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: true,
});

export default Coupon;
