//controllers/recipeController.js

const { Op } = require("sequelize");
const { Recipe, Category } = require("../models/index");
const sanitizeHtml = require("sanitize-html");
const { v4: uuidv4 } = require("uuid");

//get all recipes for the logged-in user GET /api/recipes
const getRecipes = async (req, res) => {
  // get user id from req
  const user = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";
  const favoritesOnly = req.query.favorites === "true";

  const whereClause = {
    userId: user.userId,
    ...(search && { title: { [Op.like]: `%${search}%` } }),
    ...(favoritesOnly && { isFavorite: true }),
  };
  try {
    //user found,
    // select * from recipes where recipes.userId = auth0Id limit 10 order by createdAt DESC;
    const { count, rows } = await Recipe.findAndCountAll({
      limit,
      where: whereClause,
      order: [["createdAt", "DESC"]],
      offset,
      include: [{ model: Category }],
    });

    //send back recipes to client
    res.json({
      success: true,
      msg: "success",
      recipes: rows,
      userPlan: user.plan,
      hasMore: offset + rows.length < count,
      total: count,
      userId: user.userId,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

//GET api/recipes/:id
const getRecipeById = async (req, res) => {
  //get id from params
  const { id } = req.params;
  // query database with id
  try {
    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        msg: "Recipe not found",
      });
    }

    //check user owns recipe
    const user = req.user;
    if (recipe.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access",
      });
    }

    return res.json({
      success: true,
      recipe,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      msg: `Recipe with id ${id} not exist`,
    });
  }
};

//POST /api/recipes
//insert into tables Recipes values ()
const createRecipe = async (req, res) => {
  const { title, description, duration, servings, ingredients, instructions } =
    req.body;
  // validate fields before inserting into database
  try {
    if (!title || !description || !duration || !ingredients || !instructions) {
      throw new Error("Please enter valid fields");
    }
    const user = req.user;

    if (user.plan === "free") {
      const recipeCount = await Recipe.count({
        where: { userId: user.userId },
      });

      if (recipeCount >= 3) {
        return res.status(403).json({
          success: false,
          msg: "Free plan limited to 3 recipes. Upgrade to Pro for unlimited recipes!",
        });
      }
    }

    //sanitize html
    const cleanInstructions = sanitizeHtml(instructions, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "br",
        "span",
        "b",
        "i",
        "em",
        "strong",
        "ol",
        "ul",
        "li",
        "p",
      ],
      allowedAttributes: { "*": ["style", "class"] },
    });
    // if validated, pass values to be created
    const newRecipe = await Recipe.create({
      title,
      description,
      duration,
      servings: servings || null,
      ingredients,
      instructions: cleanInstructions,
      imageUrl: req.file ? req.file.path : undefined, // <- cloudinary URL
      userId: user.userId,
    });

    return res.json({
      success: true,
      msg: "New recipe created!",
      newRecipe,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

//PUT /api/recipes/:id
const updateRecipe = async (req, res) => {
  const { id } = req.params;
  //get updated fields
  const { title, description, duration, servings, ingredients, instructions } =
    req.body;
  //query database to find record and update
  try {
    //check user owns recipe to edit
    const user = req.user;
    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        msg: "Recipe not found",
      });
    }

    //user ownership check
    if (recipe.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access",
      });
    }

    //sanitize
    const cleanInstructions = sanitizeHtml(instructions, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "br",
        "span",
        "b",
        "i",
        "em",
        "strong",
        "ol",
        "ul",
        "li",
        "p",
      ],
      allowedAttributes: { "*": ["style", "class"] },
    });

    const updatedData = {
      title: title,
      description: description,
      duration: duration,
      servings: servings,
      ingredients: ingredients,
      instructions: cleanInstructions,
    };

    if (req.file) {
      updatedData.imageUrl = req.file.path;
    }

    await Recipe.update(updatedData, {
      where: {
        recipeId: id,
      },
    });

    const updatedRecipe = await Recipe.findByPk(id);

    return res.json({
      success: true,
      msg: "Updated successfully",
      updatedRecipe,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

//DELETE /api/recipes/:id
const deleteRecipe = async (req, res) => {
  const { id } = req.params;
  try {
    //first find recipe
    const recipe = await Recipe.findByPk(id);

    //check it exists
    if (!recipe) {
      return res.status(404).json({
        success: false,
        msg: "Recipe not found",
      });
    }

    //check user owns recipe to delete
    const user = req.user;
    if (recipe.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access",
      });
    }

    //delete
    const deletedProject = await Recipe.destroy({
      where: {
        recipeId: id,
      },
    });
    if (!deletedProject) throw new Error("Recipe does not exist");

    return res.json({
      success: true,
      msg: `Recipe sucessfully deleted`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

// PATCH /api/recipes/:id/share
const toggleShare = async (req, res) => {
  const { id } = req.params;
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
        msg: "Unauthorized access",
      });
    }

    if (recipe.isShared) {
      //unshare -- clear the shareId
      await recipe.update({
        isShared: false,
        shareId: null,
      });
      return res.json({
        success: true,
        msg: "Recipe unshared",
        isShared: false,
      });
    } else {
      //share - generate a unique shareId
      const shareId = uuidv4();
      await recipe.update({ isShared: true, shareId });
      return res.json({
        success: true,
        msg: "Recipe shared",
        isShared: true,
        shareId,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

//PATCH /api/recipes/:id/favorite
const toggleFavorite = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    //find recipe in db
    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        msg: "Recipe not found",
      });
    }

    //user check
    if (recipe.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access",
      });
    }

    //if recipe.isFavorite is true
    if (recipe.isFavorite) {
      await recipe.update({ isFavorite: false });
      return res.json({
        success: true,
        msg: "Recipe unfavorited",
        isFavorite: false,
      });
    } else {
      await recipe.update({ isFavorite: true });
      return res.json({
        success: true,
        msg: "Recipe favorited",
        isFavorite: true,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

//GET /api/recipes/share/:shareId
const getSharedRecipe = async (req, res) => {
  const { shareId } = req.params;

  try {
    const recipe = await Recipe.findOne({
      where: { shareId, isShared: true },
      attributes: ["title", "description", "imageUrl"], //preview only
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        msg: "Recipe not found or no longer shared",
      });
    }

    return res.json({ success: true, recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

module.exports = {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleShare,
  toggleFavorite,
  getSharedRecipe,
};
