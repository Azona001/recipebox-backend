// models/User.js
const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

// Define the User model

const User = sequelize.define(
  "User",
  {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
    },
    auth0Id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    plan: {
      type: DataTypes.ENUM("free", "pro"),
      defaultValue: "free",
    },
  },
  { timestamps: true },
);

//hash password before saving to database
/*User.beforeSave(async (user, options = {}) => {
  //look up sequelize hooks for this
  const saltRounds = 10;
  if (user.changed("password")) {
    if (!user.password || user.password.length < 8)
      throw new Error("Password must be at least 8 characters long");

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;
  }
});

// Add a method to compare passwords (for authentication)
User.prototype.comparePassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};*/

module.exports = User;
