const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleShare,
  toggleFavorite,
  getSharedRecipe,
} = require("../../controllers/recipeController");

//mocks

jest.mock("../../models/index.js", () => ({
  Recipe: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    destroy: jest.fn(),
  },
  Category: {},
}));

jest.mock("sanitize-html", () => jest.fn((html) => html));
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid-1234") }));

const { Recipe } = require("../../models/index");

//Helpers
//Reusable mock res object
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockUser = { userId: "user-123", plan: "pro" };

//getRecipes

describe("getRecipes()", () => {
  let req, res;

  beforeEach(() => {
    req = { user: mockUser, query: {} };
    res = mockRes();
    jest.clearAllMocks();
  });

  test("returns recipes for the logged-in user", async () => {
    Recipe.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [
        { id: 1, title: "Pasta" },
        { id: 2, title: "Pizza" },
      ],
    });
    await getRecipes(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 2,
        recipes: expect.any(Array),
      }),
    );
  });

  test("uses default pagination (page 1, limit 6)", async () => {
    Recipe.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getRecipes(req, res);

    expect(Recipe.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 6,
        offset: 0,
      }),
    );
  });

  test("applies search filter when provided", async () => {
    req.query.search = "pasta";
    Recipe.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getRecipes(req, res);

    expect(Recipe.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: expect.anything(), // Op.like applied
        }),
      }),
    );
  });

  test("filters by favorites when favoritesOnly is true", async () => {
    req.query.favorites = "true";
    Recipe.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getRecipes(req, res);

    expect(Recipe.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isFavorite: true }),
      }),
    );
  });

  test("returns 500 on server error", async () => {
    Recipe.findAndCountAll.mockRejectedValue(new Error("DB error"));

    await getRecipes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });
});

// ── getRecipeById ─────────────────────────────────────────────────────────────

describe("getRecipeById()", () => {
  let req, res;

  beforeEach(() => {
    req = { user: mockUser, params: { id: "1" } };
    res = mockRes();
    jest.clearAllMocks();
  });

  test("returns recipe when found and user owns it", async () => {
    Recipe.findByPk.mockResolvedValue({
      id: 1,
      title: "Pasta",
      userId: "user-123",
    });

    await getRecipeById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        recipe: expect.any(Object),
      }),
    );
  });

  test("returns 404 when recipe not found", async () => {
    Recipe.findByPk.mockResolvedValue(null);

    await getRecipeById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Recipe not found",
      }),
    );
  });

  test("returns 403 when user does not own recipe", async () => {
    Recipe.findByPk.mockResolvedValue({ id: 1, userId: "other-user" });

    await getRecipeById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Unauthorized access",
      }),
    );
  });

  test("returns 500 on server error", async () => {
    Recipe.findByPk.mockRejectedValue(new Error("DB error"));

    await getRecipeById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── createRecipe ──────────────────────────────────────────────────────────────

describe("createRecipe()", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: mockUser,
      body: {
        title: "Pasta",
        description: "Tasty",
        duration: "30 mins",
        ingredients: "flour, water",
        instructions: "<p>Mix it</p>",
        servings: 2,
      },
      file: null,
    };
    res = mockRes();
    jest.clearAllMocks();
  });

  test("creates a recipe successfully", async () => {
    Recipe.create.mockResolvedValue({ id: 1, title: "Pasta" });

    await createRecipe(req, res);

    expect(Recipe.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        msg: "New recipe created!",
      }),
    );
  });

  test("returns 500 when required fields are missing", async () => {
    req.body.title = ""; // missing title

    await createRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(Recipe.create).not.toHaveBeenCalled();
  });

  test("blocks free plan users with 3 or more recipes", async () => {
    req.user = { userId: "user-123", plan: "free" };
    Recipe.count.mockResolvedValue(3);

    await createRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining("Free plan"),
      }),
    );
    expect(Recipe.create).not.toHaveBeenCalled();
  });

  test("allows free plan users with fewer than 3 recipes", async () => {
    req.user = { userId: "user-123", plan: "free" };
    Recipe.count.mockResolvedValue(2);
    Recipe.create.mockResolvedValue({ id: 1, title: "Pasta" });

    await createRecipe(req, res);

    expect(Recipe.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  test("uses cloudinary URL when file is uploaded", async () => {
    req.file = { path: "https://cloudinary.com/image.jpg" };
    Recipe.create.mockResolvedValue({ id: 1 });

    await createRecipe(req, res);

    expect(Recipe.create).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://cloudinary.com/image.jpg",
      }),
    );
  });
});

// ── updateRecipe ──────────────────────────────────────────────────────────────

describe("updateRecipe()", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: mockUser,
      params: { id: "1" },
      body: {
        title: "Updated Pasta",
        description: "Even tastier",
        duration: "25 mins",
        ingredients: "flour, water, salt",
        instructions: "<p>Mix well</p>",
        servings: 4,
      },
      file: null,
    };
    res = mockRes();
    jest.clearAllMocks();
  });

  test("updates recipe successfully", async () => {
    Recipe.findByPk
      .mockResolvedValueOnce({ id: 1, userId: "user-123" }) // ownership check
      .mockResolvedValueOnce({ id: 1, title: "Updated Pasta" }); // refetch after update
    Recipe.update.mockResolvedValue([1]);

    await updateRecipe(req, res);

    expect(Recipe.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        msg: "Updated successfully",
      }),
    );
  });

  test("returns 404 when recipe not found", async () => {
    Recipe.findByPk.mockResolvedValue(null);

    await updateRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 403 when user does not own recipe", async () => {
    Recipe.findByPk.mockResolvedValue({ id: 1, userId: "other-user" });

    await updateRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── deleteRecipe ──────────────────────────────────────────────────────────────

describe("deleteRecipe()", () => {
  let req, res;

  beforeEach(() => {
    req = { user: mockUser, params: { id: "1" } };
    res = mockRes();
    jest.clearAllMocks();
  });

  test("deletes recipe successfully", async () => {
    Recipe.findByPk.mockResolvedValue({ id: 1, userId: "user-123" });
    Recipe.destroy.mockResolvedValue(1);

    await deleteRecipe(req, res);

    expect(Recipe.destroy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        msg: expect.stringContaining("deleted"),
      }),
    );
  });

  test("returns 404 when recipe not found", async () => {
    Recipe.findByPk.mockResolvedValue(null);

    await deleteRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(Recipe.destroy).not.toHaveBeenCalled();
  });

  test("returns 403 when user does not own recipe", async () => {
    Recipe.findByPk.mockResolvedValue({ id: 1, userId: "other-user" });

    await deleteRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Recipe.destroy).not.toHaveBeenCalled();
  });
});

// ── toggleShare ───────────────────────────────────────────────────────────────

describe("toggleShare()", () => {
  let req, res;

  beforeEach(() => {
    req = { user: mockUser, params: { id: "1" } };
    res = mockRes();
    jest.clearAllMocks();
  });

  test("shares an unshared recipe and returns a shareId", async () => {
    const mockUpdate = jest.fn();
    Recipe.findByPk.mockResolvedValue({
      userId: "user-123",
      isShared: false,
      update: mockUpdate,
    });

    await toggleShare(req, res);

    expect(mockUpdate).toHaveBeenCalledWith({
      isShared: true,
      shareId: "mock-uuid-1234",
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        isShared: true,
        shareId: "mock-uuid-1234",
      }),
    );
  });

  test("unshares a shared recipe and clears shareId", async () => {
    const mockUpdate = jest.fn();
    Recipe.findByPk.mockResolvedValue({
      userId: "user-123",
      isShared: true,
      update: mockUpdate,
    });

    await toggleShare(req, res);

    expect(mockUpdate).toHaveBeenCalledWith({ isShared: false, shareId: null });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ isShared: false }),
    );
  });

  test("returns 404 when recipe not found", async () => {
    Recipe.findByPk.mockResolvedValue(null);

    await toggleShare(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 403 when user does not own recipe", async () => {
    Recipe.findByPk.mockResolvedValue({
      userId: "other-user",
      isShared: false,
    });

    await toggleShare(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── toggleFavorite ────────────────────────────────────────────────────────────

describe("toggleFavorite()", () => {
  let req, res;

  beforeEach(() => {
    req = { user: mockUser, params: { id: "1" } };
    res = mockRes();
    jest.clearAllMocks();
  });

  test("favorites an unfavorited recipe", async () => {
    const mockUpdate = jest.fn();
    Recipe.findByPk.mockResolvedValue({
      userId: "user-123",
      isFavorite: false,
      update: mockUpdate,
    });

    await toggleFavorite(req, res);

    expect(mockUpdate).toHaveBeenCalledWith({ isFavorite: true });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ isFavorite: true }),
    );
  });

  test("unfavorites a favorited recipe", async () => {
    const mockUpdate = jest.fn();
    Recipe.findByPk.mockResolvedValue({
      userId: "user-123",
      isFavorite: true,
      update: mockUpdate,
    });

    await toggleFavorite(req, res);

    expect(mockUpdate).toHaveBeenCalledWith({ isFavorite: false });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ isFavorite: false }),
    );
  });

  test("returns 404 when recipe not found", async () => {
    Recipe.findByPk.mockResolvedValue(null);

    await toggleFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── getSharedRecipe ───────────────────────────────────────────────────────────

describe("getSharedRecipe()", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { shareId: "mock-uuid-1234" } };
    res = mockRes();
    jest.clearAllMocks();
  });

  test("returns shared recipe by shareId", async () => {
    Recipe.findOne.mockResolvedValue({
      title: "Pasta",
      description: "Tasty",
      imageUrl: null,
    });

    await getSharedRecipe(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        recipe: expect.any(Object),
      }),
    );
  });

  test("returns 404 when recipe not found or no longer shared", async () => {
    Recipe.findOne.mockResolvedValue(null);

    await getSharedRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Recipe not found or no longer shared",
      }),
    );
  });

  test("returns 500 on server error", async () => {
    Recipe.findOne.mockRejectedValue(new Error("DB error"));

    await getSharedRecipe(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
