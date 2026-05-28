const express = require("express");
const attachUser = require("../middleware/attachUser");
const verifyToken = require("../middleware/auth");
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();
router.use(verifyToken);
router.use(attachUser);

// /api/categories
router
  .get("/", getCategories)
  .post("/", createCategory)
  .delete("/:id", deleteCategory);

module.exports = router;
