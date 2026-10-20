'use strict';

const mysql = require('mysql2/promise');

function positiveInteger(name, fallback) {
    const raw = process.env[name];

    if (raw === undefined || raw === '') {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer.`);
    }

    return value;
}

const password = process.env.DB_PASSWORD;

if (!password) {
    throw new Error('DB_PASSWORD is missing from the environment.');
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql',
    port: positiveInteger('DB_PORT', 3306),
    database: process.env.DB_NAME || 'travel_agency',
    user: process.env.DB_USER || 'app_user',
    password,
    charset: 'utf8mb4_unicode_ci',
    timezone: 'Z',
    decimalNumbers: true,
    waitForConnections: true,
    connectionLimit: positiveInteger('DB_POOL_SIZE', 10),
    maxIdle: positiveInteger('DB_POOL_SIZE', 10),
    idleTimeout: 60000,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    multipleStatements: false
});

async function query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function execute(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result;
}

async function getConnection() {
    return pool.getConnection();
}

async function withTransaction(callback) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function healthCheck() {
    await pool.query('SELECT 1');
    return true;
}

async function close() {
    await pool.end();
}

module.exports = {
    pool,
    query,
    execute,
    getConnection,
    withTransaction,
    healthCheck,
    close
};
