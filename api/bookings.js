const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baby_bliss',
  port: process.env.DB_PORT || 3306,
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const { search, status, limit = 10, offset = 0 } = req.query;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Get total count
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM bookings WHERE 1=1 ${whereClause}`,
      params
    );

    // Get bookings with pagination
    const [bookings] = await connection.execute(
      `SELECT id, client_id, first_name, last_name, email, phone, event_date, guests, venue, package, special_requests, images, status, created_at, updated_at FROM bookings WHERE 1=1 ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    await connection.end();

    res.json({
      bookings,
      total: countResult[0].total
    });
  } catch (error) {
    console.error('Bookings API error:', error);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
}