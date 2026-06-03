//route/recipes.js

const express = require("express");
const {
  getRecipeById,
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleShare,
  toggleFavorite,
  getSharedRecipe,
} = require("../controllers/recipeController");
const verifyToken = require("../middleware/auth");
const attachUser = require("../middleware/attachUser");
const {
  addCategoryToRecipe,
  removeCategoryFromRecipe,
} = require("../controllers/recipeCategoryController");
const { upload } = require("../config/cloudinary");

const router = express.Router();

//public route
router.get("/share/:shareId", getSharedRecipe);

router.use(verifyToken);
router.use(attachUser);

// /api/recipes
router
  .get("/", getRecipes)
  .get("/:id", getRecipeById)
  .post("/", upload.single("image"), createRecipe)
  .put("/:id", upload.single("image"), updateRecipe)
  .delete("/:id", deleteRecipe);

router.patch("/:id/share", toggleShare);
router.patch("/:id/favorite", toggleFavorite);
router.post("/:id/categories", addCategoryToRecipe);
router.delete("/:id/categories/:categoryId", removeCategoryFromRecipe);

module.exports = router;
