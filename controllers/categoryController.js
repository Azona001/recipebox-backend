const { Category } = require("../models/index");
const {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} = require("../utils/AppError");

const getCategories = async (req, res) => {
  const user = req.user;

  const categories = await Category.findAll({
    where: { userId: user.userId },
  });

  if (categories.length === 0) {
    return res.json({
      success: true,
      msg: "No category added yet",
      categories: [],
    });
  }

  res.json({ success: true, msg: "success", categories });
};

const createCategory = async (req, res) => {
  const user = req.user;
  const { category } = req.body;

  if (!category) throw new ValidationError("Please provide name");

  const createdCategory = await Category.create({
    categoryName: category,
    userId: user.userId,
  });

  res.json({ success: true, msg: "Category created!", createdCategory });
};

const deleteCategory = async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const category = await Category.findByPk(id);
  if (!category) throw new NotFoundError("Category not found");
  if (category.userId !== user.userId)
    throw new UnauthorizedError("Forbidden request");

  await Category.destroy({ where: { categoryId: id } });

  res.json({ success: true, msg: `Category of id ${id} deleted successfully` });
};

module.exports = { getCategories, createCategory, deleteCategory };
