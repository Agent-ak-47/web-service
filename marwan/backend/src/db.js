import mysql from 'mysql2/promise';

import { config } from './config.js';

// Single shared MySQL database `travel_agency`. This service only reads and
// writes the `excursions` and `excursion_capacity_movements` tables — every
// other table is owned by another member and must never be touched directly.
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  // Keep DATE/TIME/DATETIME as strings so `date` (YYYY-MM-DD) and
  // `start_time` (HH:mm:ss) can be answered verbatim.
  dateStrings: true,
  timezone: 'Z',
});
