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

    // Get booking statistics
    const [statsResult] = await connection.execute(`
      SELECT
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as monthly_bookings,
        SUM(CASE WHEN event_date >= CURRENT_DATE() THEN 1 ELSE 0 END) as upcoming_events
      FROM bookings
    `);

    await connection.end();

    const stats = statsResult[0];

    // Calculate estimated revenue (assuming $50 per guest)
    const estimatedRevenue = stats.upcoming_events * 50;

    res.json({
      stats: {
        total_bookings: parseInt(stats.total_bookings) || 0,
        pending_bookings: parseInt(stats.pending_bookings) || 0,
        confirmed_bookings: parseInt(stats.confirmed_bookings) || 0,
        cancelled_bookings: parseInt(stats.cancelled_bookings) || 0,
        monthly_bookings: parseInt(stats.monthly_bookings) || 0,
        upcoming_events: parseInt(stats.upcoming_events) || 0,
        estimated_revenue: estimatedRevenue,
        recent_activities: [],
        monthly_trends: [],
        status_distribution: []
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
}