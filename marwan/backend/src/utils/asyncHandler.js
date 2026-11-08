// Express 4 does not catch rejections from async route handlers. This wrapper
// forwards them to the central error handler instead of crashing the process.
export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
