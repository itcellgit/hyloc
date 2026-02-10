/**
 * Wrapper to catch errors in async route handlers
 * Express doesn't automatically catch errors in async functions
 * This middleware ensures errors are passed to the error handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
