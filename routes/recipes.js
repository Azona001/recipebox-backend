//route/recipes.js

const express = require("express");
const {
  getRecipeById,
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require("../controllers/recipeController");
const verifyToken = require("../middleware/auth");
const attachUser = require("../middleware/attachUser");
const {
  addCategoryToRecipe,
  removeCategoryFromRecipe,
} = require("../controllers/recipeCategoryController");
const { upload } = require("../config/cloudinary");

const router = express.Router();
router.use(verifyToken);
router.use(attachUser);

// /api/recipes
router
  .get("/", getRecipes)
  .get("/:id", getRecipeById)
  .post("/", upload.single("image"), createRecipe)
  .put("/:id", upload.single("image"), updateRecipe)
  .delete("/:id", deleteRecipe);

router.post("/:id/categories", addCategoryToRecipe);
router.delete("/:id/categories/:categoryId", removeCategoryFromRecipe);

module.exports = router;
