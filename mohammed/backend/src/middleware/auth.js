import jwt from 'jsonwebtoken';

import { config } from '../config.js';
import { fail } from '../utils/response.js';

// The role is carried inside the JWT issued by the Auth service (Kamal) and is
// verified server-side. This service does not read the `users` or `sessions`
// tables — they belong to another member — it only decodes the shared token.
export function requireAdmin(req, res, next) {
  if (!config.jwtSecret) {
    return fail(
      res,
      'INTERNAL_ERROR',
      'JWT_SECRET is not configured for the flight service.',
      500,
    );
  }

  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return fail(res, 'UNAUTHENTICATED', 'Authentication is required.', 401);
  }

  const token = header.slice(7).trim();

  if (!token) {
    return fail(res, 'UNAUTHENTICATED', 'Authentication is required.', 401);
  }

  let payload;

  try {
    payload = jwt.verify(token, config.jwtSecret, {
      algorithms: [config.jwtAlgorithm],
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return fail(res, 'TOKEN_EXPIRED', 'The session has expired.', 401);
    }

    return fail(res, 'UNAUTHENTICATED', 'The session is invalid.', 401);
  }

  if (payload.role !== 'ADMIN') {
    return fail(res, 'FORBIDDEN', 'Administrator access is required.', 403);
  }

  req.auth = {
    userId: payload.sub,
    role: payload.role,
    email: payload.email,
  };

  return next();
}
