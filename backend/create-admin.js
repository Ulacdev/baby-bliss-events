require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
  });

  const email = 'admin@babybliss.com';
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await pool.execute(
      'INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)',
      ['admin', email, passwordHash, 'admin']
    );
    console.log('✅ Admin user created/updated successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
