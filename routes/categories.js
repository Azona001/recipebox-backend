const express = require("express");
const attachUser = require("../middleware/attachUser");
const verifyToken = require("../middleware/auth");
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(verifyToken);
router.use(attachUser);

// /api/categories

router.get("/", asyncHandler(getCategories));
router.post("/", asyncHandler(createCategory));
router.delete("/:id", asyncHandler(deleteCategory));

module.exports = router;
