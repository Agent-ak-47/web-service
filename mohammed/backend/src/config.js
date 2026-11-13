import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Attempt to load from mohammed/backend/.env, falling back to root .env if present
dotenv.config({ path: path.join(dirname, '..', '.env') });
dotenv.config({ path: path.join(dirname, '..', '..', '..', '.env') });

function toInt(value, fallback) {
  const number = Number.parseInt(value, 10);

  return Number.isNaN(number) ? fallback : number;
}

function toNumber(value, fallback) {
  const number = Number.parseFloat(value);

  return Number.isNaN(number) ? fallback : number;
}

export const config = {
  port: toInt(process.env.PORT || process.env.MOHAMMED_PORT, 8081),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3307),
    database: process.env.DB_NAME || 'travel_agency',
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'app_pwd_2026',
  },

  jwtSecret: process.env.JWT_SECRET || '',
  jwtAlgorithm: 'HS256',

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  serviceTimeout: toNumber(process.env.SERVICE_TIMEOUT, 3),
};
