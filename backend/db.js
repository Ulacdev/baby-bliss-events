const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baby_bliss',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: process.env.DB_POOL_SIZE || 25,
  queueLimit: 0,
  connectTimeout: 10000,
  // Enable connection keep-alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Health check function for monitoring
async function healthCheck() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { status: 'healthy', message: 'Database connection is active' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

// Execute query with automatic connection handling
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

// Get a connection for transactions
async function getConnection() {
  return await pool.getConnection();
}

module.exports = {
  pool,
  testConnection,
  healthCheck,
  query,
  getConnection
};
