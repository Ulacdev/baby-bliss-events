const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();
const { pool, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Baby Bliss API Server', status: 'running' });
});

// Auth routes
app.post('/api/auth.php', async (req, res) => {
  const { action } = req.query;

  try {
    if (action === 'login') {
      const { email, password } = req.body;

      // Get user from database
      const [users] = await pool.execute(
        'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ? AND status = "active"',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        session: {
          access_token: token,
          token_type: 'bearer'
        }
      });
    } else if (action === 'session') {
      // Verify token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ user: null, session: null });
      }

      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

        const [users] = await pool.execute(
          'SELECT id, email, first_name, last_name, role FROM users WHERE id = ? AND status = "active"',
          [decoded.id]
        );

        if (users.length === 0) {
          return res.json({ user: null, session: null });
        }

        const user = users[0];
        res.json({
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          },
          session: {
            access_token: token,
            token_type: 'bearer'
          }
        });
      } catch (error) {
        res.json({ user: null, session: null });
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Dashboard route
app.get('/api/dashboard.php', async (req, res) => {
  try {
    // Get booking statistics
    const [statsResult] = await pool.execute(`
      SELECT
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as monthly_bookings,
        SUM(CASE WHEN event_date >= CURRENT_DATE() THEN 1 ELSE 0 END) as upcoming_events
      FROM bookings
    `);

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
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Settings route
app.get('/api/settings.php', async (req, res) => {
  try {
    const [settings] = await pool.execute('SELECT setting_key, setting_value FROM settings');

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Settings error:', error);
    // Return default settings if database fails
    res.json({
      settings: {
        general_site_title: 'Baby Bliss',
        general_logo_url: '/Baby_Cloud_To_Bliss_Text_Change.png',
        general_favicon_url: '',
        general_logo_size: '32',
        general_company_name: 'Baby Bliss Events',
        general_company_email: 'info@babybliss.com',
        general_company_phone: '(555) 123-4567',
        navbar_nav_home_text: 'Home',
        navbar_nav_about_text: 'About',
        navbar_nav_gallery_text: 'Events',
        navbar_nav_book_text: 'Book Now',
        navbar_nav_contact_text: 'Contact',
        navbar_nav_login_text: 'Login',
        footer_footer_text: '© 2024 Baby Bliss Events. All rights reserved.',
        footer_footer_address: '123 Main Street, City, State 12345'
      }
    });
  }
});

// Bookings route
app.get('/api/bookings.php', async (req, res) => {
  try {
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
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM bookings WHERE 1=1 ${whereClause}`,
      params
    );

    // Get bookings with pagination
    const [bookings] = await pool.execute(
      `SELECT id, client_id, first_name, last_name, email, phone, event_date, guests, venue, package, special_requests, images, status, created_at, updated_at FROM bookings WHERE 1=1 ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      bookings,
      total: countResult[0].total
    });
  } catch (error) {
    console.error('Bookings error:', error);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Baby Bliss API Server running on port ${PORT}`);
  console.log(`📱 Frontend should connect to: http://localhost:${PORT}/api/*`);

  // Test database connection
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('🗄️  Database connected successfully');
  } else {
    console.log('❌ Database connection failed - check your .env configuration');
  }
});