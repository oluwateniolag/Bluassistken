const { Sequelize } = require('sequelize');

// Use DATABASE_URL (Render PostgreSQL) or individual env vars
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
    })
  : new Sequelize(
      process.env.DB_NAME || 'bluv2',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
      }
    );

// Test connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');

    if (process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
