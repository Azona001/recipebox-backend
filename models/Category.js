// models/Category.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Define the Category model
const Category = sequelize.define("Category", {
  categoryId: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  categoryName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

module.exports = Category;
