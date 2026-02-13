const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // Ab ye .env se uthayega
  database: process.env.DB_NAME || 'pvj',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000
});

// Retry DB connection on startup if it fails
async function testDbConnectionWithRetry(retryDelay = 5000) {
  while (true) {
    try {
      const conn = await pool.getConnection();
      console.log('MySQL database connected successfully!');
      conn.release();
      break;
    } catch (err) {
      console.error('MySQL database connection failed:', err.message);
      await new Promise(res => setTimeout(res, retryDelay));
    }
  }
}

testDbConnectionWithRetry();

module.exports = pool;