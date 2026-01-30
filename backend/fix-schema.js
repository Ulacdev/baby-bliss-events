require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixSchema() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 1
  });

  try {
    // Check and add columns to users table one by one
    console.log('Checking users table columns...');
    
    const [columns] = await pool.execute("SHOW COLUMNS FROM users LIKE 'first_name'");
    if (columns.length === 0) {
      await pool.execute("ALTER TABLE users ADD COLUMN first_name VARCHAR(255) DEFAULT ''");
      console.log('✅ Added first_name column');
    } else {
      console.log('✅ first_name column already exists');
    }

    const [columns2] = await pool.execute("SHOW COLUMNS FROM users LIKE 'last_name'");
    if (columns2.length === 0) {
      await pool.execute("ALTER TABLE users ADD COLUMN last_name VARCHAR(255) DEFAULT ''");
      console.log('✅ Added last_name column');
    } else {
      console.log('✅ last_name column already exists');
    }

    const [columns3] = await pool.execute("SHOW COLUMNS FROM users LIKE 'phone'");
    if (columns3.length === 0) {
      await pool.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT ''");
      console.log('✅ Added phone column');
    } else {
      console.log('✅ phone column already exists');
    }

    const [columns4] = await pool.execute("SHOW COLUMNS FROM users LIKE 'profile_image'");
    if (columns4.length === 0) {
      await pool.execute("ALTER TABLE users ADD COLUMN profile_image VARCHAR(500) DEFAULT ''");
      console.log('✅ Added profile_image column');
    } else {
      console.log('✅ profile_image column already exists');
    }

    // Create audit_logs table if not exists
    console.log('Creating audit_logs table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        activity VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Audit logs table ready');

    // Create archive table if not exists
    console.log('Creating archive table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS archive (
        id INT AUTO_INCREMENT PRIMARY KEY,
        record_type VARCHAR(50) NOT NULL,
        record_id INT NOT NULL,
        data JSON,
        archived_by INT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Archive table ready');

    // Create clients table if not exists
    console.log('Creating clients table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Clients table ready');

    console.log('\n✅ Database schema fixed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixSchema();
