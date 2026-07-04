// routes/recipes.js
const express = require("express");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");
const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleShare,
  toggleFavorite,
  getSharedRecipe,
} = require("../controllers/recipeController");

// Wrap every async controller
router.get("/", asyncHandler(getRecipes));
router.get("/share/:shareId", asyncHandler(getSharedRecipe));
router.get("/:id", asyncHandler(getRecipeById));
router.post("/", asyncHandler(createRecipe));
router.put("/:id", asyncHandler(updateRecipe));
router.delete("/:id", asyncHandler(deleteRecipe));
router.patch("/:id/share", asyncHandler(toggleShare));
router.patch("/:id/favorite", asyncHandler(toggleFavorite));

module.exports = router;
