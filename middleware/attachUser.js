///middleware/attachUser.js

const { User } = require("../models/index");

const attachUser = async (req, res, next) => {
  try {
    const auth0Id = req.auth.sub;
    let user = await User.findOne({
      where: {
        auth0Id,
      },
    });

    //if user does not exist in database, create new user with auth0Id
    if (!user) {
      user = await User.create({
        firstName: req.auth.given_name || "User",
        lastName: req.auth.family_name || "",
        email: req.auth.email || null,
        auth0Id,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

module.exports = attachUser;
