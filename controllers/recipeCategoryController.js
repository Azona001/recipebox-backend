const { Recipe, Category } = require("../models");

//add a category to a recipe
const addCategoryToRecipe = async (req, res) => {
  const { id } = req.params;
  const { categoryId } = req.body;
  const user = req.user;

  try {
    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        msg: "Recipe not found",
      });
    }

    if (recipe.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        msg: "Category not found",
      });
    }

    if (category.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    //add the category to the recipe
    await recipe.addCategory(category);
    res.json({
      success: true,
      msg: "Category added to recipes",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

//Remove a category from a recipe
const removeCategoryFromRecipe = async (req, res) => {
  const { id, categoryId } = req.params;
  const user = req.user;

  try {
    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        msg: "Recipe not found",
      });
    }

    if (recipe.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        msg: "Category not found",
      });
    }

    //remove the category from the recipe
    await recipe.removeCategory(category);
    res.json({
      success: true,
      msg: "Category removed from recipe",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

module.exports = { addCategoryToRecipe, removeCategoryFromRecipe };
