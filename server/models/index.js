import sequelize from '../config/db.js';
import Admin from './Admin.js';
import Customer from './Customer.js';
import Category from './Category.js';
import Occasion from './Occasion.js';
import Brand from './Brand.js';
import HeroSlide from './HeroSlide.js';
import HomepageSection from './HomepageSection.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import SiteSetting from './SiteSetting.js';
import Coupon from './Coupon.js';
import Product from './Product.js';
import Combo from './Combo.js';

// Define associations
Customer.hasMany(Order, { foreignKey: 'customer_id' });
Order.belongsTo(Customer, { foreignKey: 'customer_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

const db = {
  sequelize,
  Admin,
  Customer,
  Category,
  Occasion,
  Brand,
  HeroSlide,
  HomepageSection,
  Order,
  OrderItem,
  SiteSetting,
  Coupon,
  Product,
  Combo
};

export {
  sequelize,
  Admin,
  Customer,
  Category,
  Occasion,
  Brand,
  HeroSlide,
  HomepageSection,
  Order,
  OrderItem,
  SiteSetting,
  Coupon,
  Product,
  Combo
};
export default db;
