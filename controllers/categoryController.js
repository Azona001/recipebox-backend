const { Category } = require("../models/index");

const getCategories = async (req, res) => {
  const user = req.user;
  try {
    //find categories
    //select * from categories where userId = user.userId
    const categories = await Category.findAll({
      where: {
        userId: user.userId,
      },
    });

    //if no categories
    if (categories.length === 0) {
      return res.json({
        success: true,
        msg: "No category added yet",
        categories: [],
      });
    }
    //else
    return res.json({
      success: true,
      msg: "success",
      categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

const createCategory = async (req, res) => {
  const user = req.user;
  const { category } = req.body;
  try {
    // check category is valid
    if (!category) {
      return res.status(400).json({
        success: false,
        msg: "Please provide name",
      });
    }

    //if valid, create in database
    const createdCategory = await Category.create({
      categoryName: category,
      userId: user.userId,
    });

    return res.json({
      success: true,
      msg: "Category created!",
      createdCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

//DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  const user = req.user;
  //get the id of category
  const { id } = req.params;
  try {
    //get the category
    const category = await Category.findByPk(id);

    //if category not exist
    if (!category) {
      return res.status(404).json({
        success: false,
        msg: "Category not found",
      });
    }

    //else check user owns the category
    if (category.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        msg: "Forbidden request",
      });
    }

    //else grant permission
    await Category.destroy({
      where: {
        categoryId: id,
      },
    });

    return res.json({
      success: true,
      msg: `Category of id ${id} deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
