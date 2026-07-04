# RecipeBox — Backend

REST API for RecipeBox, a full stack recipe management app. Built with **Node.js**, **Express**, and **MySQL** (via Sequelize), deployed on **Railway**.

**Frontend repo/folder:** [Link to frontend]

## Features

- 🔐 **Auth0 JWT verification** — protected routes validate access tokens issued by Auth0
- 📖 **Recipe CRUD** — create, read, update, and delete recipes scoped to the authenticated user
- 🔍 **Search & pagination** — debounced search via Sequelize `Op.like`, paginated with `findAndCountAll` returning a `hasMore` flag for infinite scroll
- ❤️ **Favorites** — toggle and filter favorite recipes
- 🔗 **Public sharing** — `isShared` / `shareId` columns expose individual recipes on a public, unauthenticated route
- 🖼️ **Image uploads** — Cloudinary v2 with `multer-storage-cloudinary-v2`
- 💳 **Stripe integration** — pro plan upgrades and user plan tracking
- 🧯 **Centralized error handling** — custom error classes (`AppError`, `NotFoundError`, `UnauthorizedError`, etc.), an `asyncHandler` wrapper, and a single 4-argument error middleware
- ✅ **Jest unit tests** — controller-level tests with `eslint-plugin-jest` configured

## Tech Stack

| Category     | Tech                   |
| ------------ | ---------------------- |
| Runtime      | Node.js                |
| Framework    | Express                |
| Database     | MySQL + Sequelize ORM  |
| Auth         | Auth0 (JWT)            |
| File uploads | Multer + Cloudinary v2 |
| Payments     | Stripe                 |
| Testing      | Jest                   |
| Deployment   | Railway                |

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+ (local instance or Railway database)

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the backend root:

```env
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=recipebox
DB_USER=root
DB_PASSWORD=your_password

# Auth0
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=your_api_audience

# Jwks-rsa/express-jwt
JWKS_CLIENT=https://your_auth0_domain/.well-known/jwks.json

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# CORS
FRONTEND_URL=http://localhost:3000
```

### Running Locally

```bash
# Start the dev server
npm run dev

# Run tests
npm test
```

The API runs at `http://localhost:5000` by default.

## API Endpoints

> Adjust paths to match your actual routes.

| Method | Endpoint                      | Auth | Description                                                    |
| ------ | ----------------------------- | ---- | -------------------------------------------------------------- |
| GET    | `/api/recipes`                | ✅   | List recipes (supports `page`, `limit`, `search`, `favorites`) |
| GET    | `/api/recipes/:id`            | ✅   | Get a single recipe                                            |
| POST   | `/api/recipes`                | ✅   | Create a recipe (multipart, image upload)                      |
| PUT    | `/api/recipes/:id`            | ✅   | Update a recipe                                                |
| DELETE | `/api/recipes/:id`            | ✅   | Delete a recipe                                                |
| PATCH  | `/api/recipes/:id/favorite`   | ✅   | Toggle favorite                                                |
| PATCH  | `/api/recipes/:id/share`      | ✅   | Toggle sharing / generate `shareId`                            |
| GET    | `/api/recipes/share/:shareId` | ❌   | Public shared recipe view                                      |
| GET    | `/api/categories`             | ✅   | List all categories for the authenticated user                 |
| POST   | `/api/categories`             | ✅   | Create a new category                                          |
| DELETE | `/api/categories/:id`         | ✅   | Delete a category                                              |
| POST   | `/api/stripe/checkout`        | ✅   | Create a Stripe checkout session                               |
| POST   | `/api/stripe/webhook`         | ❌   | Stripe webhook (signature-verified)                            |

## Error Handling

All controllers are wrapped in an `asyncHandler` higher-order function that forwards rejected promises to Express's error pipeline:

```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

Custom error classes extend a base `AppError` with a `statusCode`, and a single 4-argument error middleware at the bottom of `server.js` formats every error response consistently. This keeps controllers free of repetitive try/catch blocks.

## Project Structure

```
backend/
├── config/           # DB and Cloudinary configuration
├── controllers/      # Route handlers (recipeController, etc.)
├── middleware/       # Auth (JWT check), asyncHandler, error handler
├── models/           # Sequelize models
├── routes/           # Express routers
├── utils/            # Custom error classes (AppError, NotFoundError, ...)
├── tests/            # Jest unit tests
├── server.js
└── package.json
```

## Deployment

Deployed on Railway with a managed MySQL instance. Set all environment variables in the Railway dashboard. Schema changes to production can be applied via Railway's query console or Sequelize migrations.

## License

MIT — Azona Isagba
