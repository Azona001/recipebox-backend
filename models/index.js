// models/index.js
const { DataTypes } = require("sequelize");

const User = require("./User");
const Recipe = require("./Recipe");
const Category = require("./Category");

// Define associations
// A User can have many Recipes, and a Recipe belongs to one User
User.hasMany(Recipe, {
  foreignKey: {
    name: "userId",
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    onDelete: "CASCADE",
  },
});
Recipe.belongsTo(User, {
  foreignKey: {
    name: "userId",
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
});

User.hasMany(Category, {
  foreignKey: {
    name: "userId",
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    onDelete: "CASCADE",
  },
});

Category.belongsTo(User, {
  foreignKey: {
    name: "userId",
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
});

Category.belongsToMany(Recipe, { through: "RecipeCategories" });
Recipe.belongsToMany(Category, { through: "RecipeCategories" });

module.exports = {
  User,
  Recipe,
  Category,
};
