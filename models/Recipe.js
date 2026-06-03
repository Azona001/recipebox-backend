// models/Recipe.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Define the Recipe model
const Recipe = sequelize.define(
  "Recipe",
  {
    recipeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,

    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
      },
    },

    servings: {
      type: DataTypes.INTEGER.UNSIGNED,
      validate: {
        isInt: true,
        min: 1,
      },
    },

    ingredients: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:
        "https://res.cloudinary.com/dtysy7oyr/image/upload/q_auto/f_auto/v1779775245/blank_dnr220.jpg",
    },
    isShared: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    shareId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  { timestamps: true },
);

module.exports = Recipe;
