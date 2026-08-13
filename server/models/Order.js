import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  order_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'uq_orders_order_number',
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
    allowNull: false,
    defaultValue: 'pending',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  pricing_breakdown: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  shipping_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  shipping_address: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  billing_address: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('cod', 'online', 'card', 'upi'),
    allowNull: false,
    defaultValue: 'online',
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'partially_paid', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
  },
  payment_gateway: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  payment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  cod_advance_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  cod_advance_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  cod_due_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  razorpay_order_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  razorpay_payment_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  razorpay_signature: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
});

export default Order;
