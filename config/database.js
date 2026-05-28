// config/database.js

const Sequelize = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
  },
);

const connectDb = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync();
    }
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDb };
