// Wraps async controllers so thrown errors reach Express error handler
// Without this, async throws are unhandled rejections in Express 4
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
