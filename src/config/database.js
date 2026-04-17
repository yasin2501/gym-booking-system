const mysql = require('mysql2/promise');

/**
 * Create a MySQL connection pool
 * Pool manages multiple connections for better performance
 * Connections are reused instead of creating new ones each time
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gym_booking_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Test the database connection
 * This function should be called when the server starts
 */
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

/**
 * Execute a query on the database
 * 
 * Usage:
 * const users = await executeQuery('SELECT * FROM users WHERE id = ?', [1]);
 */
async function executeQuery(query, params = []) {
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.execute(query, params);
    connection.release();
    return results;
  } catch (error) {
    console.error('❌ Query execution failed:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  executeQuery,
};
