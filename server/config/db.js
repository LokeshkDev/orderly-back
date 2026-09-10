import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000, evict: 1000 },
  dialectOptions: {
    connectTimeout: 10000, // 10s instead of default 60s - fail fast on ETIMEDOUT
    supportBigNumbers: true,
    bigNumberStrings: false
  },
  retry: { max: 3 },
  define: { timestamps: true }
});

export default sequelize;
