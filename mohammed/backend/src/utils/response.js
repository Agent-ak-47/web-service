export function ok(res, data = null, status = 200) {
  return res.status(status).json({ data });
}

export function fail(res, code, message, status = 400, details = {}) {
  return res.status(status).json({
    error: {
      code,
      message,
      details: details || {},
    },
  });
}
