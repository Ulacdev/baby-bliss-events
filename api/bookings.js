const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baby_bliss',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search, status, limit = 10, offset = 0 } = req.query;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex + 1} OR email ILIKE $${paramIndex + 2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex += 1;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM bookings WHERE 1=1 ${whereClause}`;
    const { rows: countResult } = await pool.query(countQuery, params);

    // Get bookings with pagination
    const bookingsQuery = `SELECT id, client_id, first_name, last_name, email, phone, event_date, guests, venue, package, special_requests, images, status, created_at, updated_at FROM bookings WHERE 1=1 ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const { rows: bookings } = await pool.query(bookingsQuery, [...params, parseInt(limit), parseInt(offset)]);

    res.json({
      bookings,
      total: parseInt(countResult[0].total)
    });
  } catch (error) {
    console.error('Bookings API error:', error);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
}