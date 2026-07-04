const { Op } = require("sequelize");
const { Recipe, Category } = require("../models/index");
const sanitizeHtml = require("sanitize-html");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} = require("../utils/AppError");

// Helper — reuse ownership check across handlers
const assertOwnership = (recipe, user) => {
  if (recipe.userId !== user.userId) throw new UnauthorizedError();
};

const getRecipes = async (req, res) => {
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

  const { count, rows } = await Recipe.findAndCountAll({
    limit,
    where: whereClause,
    order: [["createdAt", "DESC"]],
    offset,
    include: [{ model: Category }],
  });

  res.json({
    success: true,
    msg: "success",
    recipes: rows,
    userPlan: user.plan,
    hasMore: offset + rows.length < count,
    total: count,
    userId: user.userId,
  });
};

const getRecipeById = async (req, res) => {
  const { id } = req.params;
  const recipe = await Recipe.findByPk(id);
  if (!recipe) throw new NotFoundError("Recipe not found");
  assertOwnership(recipe, req.user);
  res.json({ success: true, recipe });
};

const createRecipe = async (req, res) => {
  const { title, description, duration, servings, ingredients, instructions } =
    req.body;

  if (!title || !description || !duration || !ingredients || !instructions) {
    throw new ValidationError("Please enter valid fields");
  }

  const user = req.user;

  if (user.plan === "free") {
    const recipeCount = await Recipe.count({ where: { userId: user.userId } });
    if (recipeCount >= 3) {
      throw new ForbiddenError(
        "Free plan limited to 3 recipes. Upgrade to Pro for unlimited recipes!",
      );
    }
  }

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

  const newRecipe = await Recipe.create({
    title,
    description,
    duration,
    servings: servings || null,
    ingredients,
    instructions: cleanInstructions,
    imageUrl: req.file ? req.file.path : undefined,
    userId: user.userId,
  });

  res.json({ success: true, msg: "New recipe created!", newRecipe });
};

const updateRecipe = async (req, res) => {
  const { id } = req.params;
  const { title, description, duration, servings, ingredients, instructions } =
    req.body;

  const recipe = await Recipe.findByPk(id);
  if (!recipe) throw new NotFoundError("Recipe not found");
  assertOwnership(recipe, req.user);

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
    title,
    description,
    duration,
    servings,
    ingredients,
    instructions: cleanInstructions,
  };
  if (req.file) updatedData.imageUrl = req.file.path;

  await Recipe.update(updatedData, { where: { recipeId: id } });
  const updatedRecipe = await Recipe.findByPk(id);

  res.json({ success: true, msg: "Updated successfully", updatedRecipe });
};

const deleteRecipe = async (req, res) => {
  const { id } = req.params;
  const recipe = await Recipe.findByPk(id);
  if (!recipe) throw new NotFoundError("Recipe not found");
  assertOwnership(recipe, req.user);

  await Recipe.destroy({ where: { recipeId: id } });
  res.json({ success: true, msg: "Recipe successfully deleted" });
};

const toggleShare = async (req, res) => {
  const { id } = req.params;
  const recipe = await Recipe.findByPk(id);
  if (!recipe) throw new NotFoundError("Recipe not found");
  assertOwnership(recipe, req.user);

  if (recipe.isShared) {
    await recipe.update({ isShared: false, shareId: null });
    return res.json({ success: true, msg: "Recipe unshared", isShared: false });
  }

  const shareId = uuidv4();
  await recipe.update({ isShared: true, shareId });
  res.json({ success: true, msg: "Recipe shared", isShared: true, shareId });
};

const toggleFavorite = async (req, res) => {
  const { id } = req.params;
  const recipe = await Recipe.findByPk(id);
  if (!recipe) throw new NotFoundError("Recipe not found");
  assertOwnership(recipe, req.user);

  const newValue = !recipe.isFavorite;
  await recipe.update({ isFavorite: newValue });
  res.json({
    success: true,
    msg: newValue ? "Recipe favorited" : "Recipe unfavorited",
    isFavorite: newValue,
  });
};

const getSharedRecipe = async (req, res) => {
  const { shareId } = req.params;
  const recipe = await Recipe.findOne({
    where: { shareId, isShared: true },
    attributes: ["title", "description", "imageUrl"],
  });
  if (!recipe) throw new NotFoundError("Recipe not found or no longer shared");
  res.json({ success: true, recipe });
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
