require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const Joi = require('joi');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Enforce JWT_SECRET - fail fast in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_APP_PASSWORD, // Your app password
  },
};

// Create email transporter
let transporter;
try {
  if (nodemailer.createTransport) {
    transporter = nodemailer.createTransport(emailConfig);
  } else {
    transporter = nodemailer(emailConfig);
  }
} catch (error) {
  console.warn('Email transporter initialization failed:', error.message);
  transporter = null;
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Rate limiting - general API (increased for development)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased from 100)
  message: { success: false, error: { message: 'Too many requests, please try again later', code: 'RATE_LIMIT_EXCEEDED' } },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: { success: false, error: { message: 'Too many login attempts, please try again later', code: 'AUTH_RATE_LIMIT' } }
});

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const bookingSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s]+$/).optional(),
  event_date: Joi.date().greater('now').required(),
  guests: Joi.number().integer().min(1).optional(),
  venue: Joi.string().max(255).optional(),
  package: Joi.string().max(100).optional(),
  package_price: Joi.number().precision(2).optional(),
  special_requests: Joi.string().max(1000).optional(),
  status: Joi.string().valid('pending', 'confirmed', 'cancelled').default('pending')
});

const clientSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  address: Joi.string().max(500).optional(),
  notes: Joi.string().max(2000).optional()
});

const userSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid('admin', 'staff').default('staff')
});

// Standardized response helper
const sendResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Standardized error response helper
const sendError = (res, message, code = 'ERROR', statusCode = 500, details = null) => {
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(isDev && details && { details })
    }
  });
};

// Default settings helper
function getDefaultSettings() {
  return {
    general_site_title: 'Baby Bliss',
    general_logo_url: '',
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
  };
}

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baby_bliss',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: process.env.DB_POOL_SIZE || 25,
  queueLimit: 0,
  connectTimeout: 10000
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// Health check function
async function healthCheck() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Access denied', 'NO_TOKEN', 401);
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', 'TOKEN_EXPIRED', 401);
    }
    return sendError(res, 'Invalid token', 'INVALID_TOKEN', 403);
  }
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    sendError(res, 'Admin access required', 'ADMIN_REQUIRED', 403);
  }
};

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await healthCheck();
  const status = dbHealth ? 'healthy' : 'unhealthy';
  
  res.status(dbHealth ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealth ? 'connected' : 'disconnected'
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Baby Bliss API Server', status: 'running' });
});

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    // Validate input
    const { error: validationError } = loginSchema.validate(req.body);
    if (validationError) {
      return sendError(res, validationError.details[0].message, 'VALIDATION_ERROR', 400);
    }

    const { email, password } = req.body;

    const [users] = await pool.execute(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return sendError(res, 'Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    const user = users[0];
    let storedHash = user.password_hash;
    
    // Handle PHP's password_hash format ($2y$) - convert to $2a$ for bcryptjs
    if (storedHash.substring(0, 4) === '$2y$') {
      storedHash = '$2a$' + storedHash.substring(4);
    }
    
    const isValidPassword = await bcrypt.compare(password, storedHash);
    if (!isValidPassword) {
      return sendError(res, 'Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    sendResponse(res, {
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      session: { access_token: token, refresh_token: refreshToken, token_type: 'bearer', expires_in: 3600 }
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 'LOGIN_ERROR', 500);
  }
});

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return sendError(res, 'Refresh token required', 'NO_REFRESH_TOKEN', 401);
    }
    
    const decoded = jwt.verify(refresh_token, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return sendError(res, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }
    
    const [users] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return sendError(res, 'Invalid refresh token', 'USER_NOT_FOUND', 401);
    }

    const user = users[0];
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    sendResponse(res, {
      session: { access_token: newAccessToken, token_type: 'bearer', expires_in: 3600 }
    }, 'Token refreshed');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Refresh token expired', 'REFRESH_EXPIRED', 401);
    }
    sendError(res, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }
});

app.get('/api/auth/session', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendResponse(res, { user: null, session: null }, 'Session check');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await pool.execute(
      'SELECT id, username, email, password_hash, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return sendResponse(res, { user: null, session: null }, 'Session check');
    }

    const user = users[0];
    sendResponse(res, {
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      session: { access_token: token, token_type: 'bearer' }
    }, 'Session valid');
  } catch (error) {
    sendResponse(res, { user: null, session: null }, 'Session check');
  }
});

app.post('/api/auth/logout', (req, res) => {
  sendResponse(res, null, 'Logged out successfully');
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Email is required', 'VALIDATION_ERROR', 400);
    }

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, username, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return sendResponse(res, null, 'If an account exists with this email, a password reset link will be sent.');
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Try to store token in database (optional - fallback if table doesn't exist)
    try {
      await pool.execute(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)',
        [user.id, resetToken, new Date(Date.now() + 15 * 60 * 1000)]
      );
    } catch (dbError) {
      console.warn('Could not store reset token in database:', dbError.message);
      // Continue anyway - token will work in the URL
    }

    // Send email (skip if transporter not available)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Baby Bliss Events" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - Baby Bliss Events',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Baby Bliss Events</h1>
            <p style="color: #e8e8e8; margin: 10px 0 0 0;">Password Reset Request</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6;">
              Hello ${user.username},<br><br>
              You have requested to reset your password for your Baby Bliss Events account.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p style="color: #666; line-height: 1.6;">
              This link will expire in 15 minutes for security reasons.<br><br>
              If you didn't request this password reset, please ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2024 Baby Bliss Events. All rights reserved.</p>
          </div>
        </div>
      `
    };

    try {
      // Skip email sending if transporter is not available
      if (transporter && process.env.EMAIL_USER) {
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', email);
      } else {
        console.log('Email not configured - reset URL:', resetUrl);
      }
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return sendError(res, 'Failed to send reset email', 'EMAIL_ERROR', 500);
    }

    sendResponse(res, null, 'If an account exists with this email, a password reset link will be sent.');
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, 'Failed to process request', 'FORGOT_PASSWORD_ERROR', 500);
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return sendError(res, 'Token and password are required', 'VALIDATION_ERROR', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 'VALIDATION_ERROR', 400);
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const [tokens] = await pool.execute(
      'SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );

    if (tokens.length === 0) {
      return sendError(res, 'Invalid or expired reset token', 'INVALID_TOKEN', 400);
    }

    const userId = tokens[0].user_id;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    // Delete the used token
    await pool.execute(
      'DELETE FROM password_reset_tokens WHERE token_hash = ?',
      [tokenHash]
    );

    sendResponse(res, null, 'Password has been reset successfully');
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Failed to reset password', 'RESET_PASSWORD_ERROR', 500);
  }
});

// ==================== DASHBOARD ROUTE ====================
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const [statsResult] = await pool.execute(`
      SELECT
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) THEN 1 ELSE 0 END) as monthly_bookings,
        SUM(CASE WHEN status = 'confirmed' AND event_date >= CURRENT_DATE() THEN 1 ELSE 0 END) as upcoming_events,
        SUM(CASE WHEN status = 'confirmed' THEN COALESCE(package_price, 0) ELSE 0 END) as estimated_revenue
      FROM bookings
      WHERE deleted_at IS NULL
    `);

    const [recentActivities] = await pool.execute(`
      SELECT id, first_name, last_name, event_date, status, created_at
      FROM bookings
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const [monthlyTrends] = await pool.execute(`
      SELECT
        MONTH(created_at) as month,
        COUNT(*) as bookings
      FROM bookings
      WHERE deleted_at IS NULL AND YEAR(created_at) = YEAR(CURRENT_DATE())
      GROUP BY MONTH(created_at)
      ORDER BY month
    `);

    const [statusDistribution] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM bookings
      WHERE deleted_at IS NULL
      GROUP BY status
    `);

    sendResponse(res, {
      stats: {
        total_bookings: statsResult[0].total_bookings || 0,
        pending_bookings: statsResult[0].pending_bookings || 0,
        confirmed_bookings: statsResult[0].confirmed_bookings || 0,
        cancelled_bookings: statsResult[0].cancelled_bookings || 0,
        monthly_bookings: statsResult[0].monthly_bookings || 0,
        upcoming_events: statsResult[0].upcoming_events || 0,
        estimated_revenue: statsResult[0].estimated_revenue || 0,
        recent_activities: recentActivities,
        monthly_trends: monthlyTrends,
        status_distribution: statusDistribution
      }
    }, 'Dashboard data retrieved');
  } catch (error) {
    console.error('Dashboard error:', error);
    sendError(res, 'Failed to load dashboard', 'DASHBOARD_ERROR', 500, error.message);
  }
});

// ==================== BOOKINGS ROUTES ====================
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { search, status, limit = 10, offset = 0, upcoming } = req.query;
    let whereClause = 'WHERE 1=1 AND deleted_at IS NULL';
    let params = [];

    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (upcoming === '1') {
      whereClause += ' AND event_date >= CURRENT_DATE() AND status = "confirmed"';
    }

    const limitNum = parseInt(limit) || 10;
    const offsetNum = parseInt(offset) || 0;

    // Use query() instead of execute() for LIMIT/OFFSET compatibility
    const [bookings] = await pool.query(
      `SELECT * FROM bookings ${whereClause} ORDER BY event_date ASC LIMIT ? OFFSET ?`,
      [...params, limitNum, offsetNum]
    );

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM bookings ${whereClause}`, params);

    sendResponse(res, { bookings, total: countResult[0].total }, 'Bookings retrieved');
  } catch (error) {
    console.error('Bookings error:', error);
    sendError(res, 'Failed to load bookings', 'BOOKINGS_ERROR', 500, error.message);
  }
});

// Public upcoming events endpoint
app.get('/api/public-events', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit) || 10;

    // Use query() instead of execute() for LIMIT clause compatibility
    const [bookings] = await pool.query(
      `SELECT id, first_name, last_name, event_date, event_title, guests, venue, package, package_price, status, images
       FROM bookings
       WHERE deleted_at IS NULL AND event_date >= CURRENT_DATE() AND status = 'confirmed'
       ORDER BY event_date ASC LIMIT ${limitNum}`
    );

    sendResponse(res, { events: bookings }, 'Public events retrieved');
  } catch (error) {
    console.error('Public events error:', error);
    sendError(res, 'Failed to load public events', 'PUBLIC_EVENTS_ERROR', 500, error.message);
  }
});

app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    sendResponse(res, { booking: bookings[0] || null }, 'Booking retrieved');
  } catch (error) {
    sendError(res, 'Failed to retrieve booking', 'BOOKING_ERROR', 500, error.message);
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    // Validate input
    const { error: validationError } = bookingSchema.validate(req.body);
    if (validationError) {
      return sendError(res, validationError.details[0].message, 'VALIDATION_ERROR', 400);
    }

    const { first_name, last_name, email, phone, event_date, guests, venue, package: packageName, package_price, special_requests, images, status } = req.body;

    // Convert undefined to null for SQL parameters
    const nullIfUndefined = (val) => val === undefined ? null : val;

    const [result] = await pool.execute(
      `INSERT INTO bookings (first_name, last_name, email, phone, event_date, guests, venue, package, package_price, special_requests, images, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nullIfUndefined(first_name), nullIfUndefined(last_name), nullIfUndefined(email), nullIfUndefined(phone), nullIfUndefined(event_date), nullIfUndefined(guests), nullIfUndefined(venue), nullIfUndefined(packageName), nullIfUndefined(package_price), nullIfUndefined(special_requests), JSON.stringify(images || []), status || 'pending']
    );

    const [booking] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [result.insertId]);
    sendResponse(res, { booking: booking[0] }, 'Booking created successfully', 201);
  } catch (error) {
    console.error('Create booking error:', error);
    sendError(res, 'Failed to create booking', 'CREATE_ERROR', 500, error.message);
  }
});

app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, event_date, guests, venue, package: packageName, package_price, special_requests, images, status } = req.body;

    await pool.execute(
      `UPDATE bookings
       SET first_name = ?, last_name = ?, email = ?, phone = ?, event_date = ?, guests = ?, venue = ?, package = ?, package_price = ?, special_requests = ?, images = ?, status = ?
       WHERE id = ?`,
      [first_name, last_name, email, phone, event_date, guests, venue, packageName, package_price, special_requests, JSON.stringify(images || []), status, req.params.id]
    );

    const [booking] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    sendResponse(res, { booking: booking[0] }, 'Booking updated successfully');
  } catch (error) {
    console.error('Update booking error:', error);
    sendError(res, 'Failed to update booking', 'UPDATE_ERROR', 500, error.message);
  }
});

app.put('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    sendResponse(res, null, 'Booking status updated');
  } catch (error) {
    sendError(res, 'Failed to update status', 'STATUS_ERROR', 500, error.message);
  }
});

app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const { id } = req.params;

    const [booking] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);
    if (booking.length === 0) {
      return sendError(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    const b = booking[0];
    await pool.execute(
      `INSERT INTO archived_bookings (original_id, first_name, last_name, email, phone, event_date, event_title, guests, venue, package, package_price, special_requests, images, status, deleted_reason, deleted_by, original_created_at, original_updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, b.first_name, b.last_name, b.email, b.phone, b.event_date, b.event_title, b.guests, b.venue, b.package, b.package_price, b.special_requests, b.images, b.status, reason || 'Deleted from bookings module', req.user.id, b.created_at, b.updated_at]
    );

    await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);
    sendResponse(res, null, 'Booking deleted and moved to archive');
  } catch (error) {
    sendError(res, 'Failed to delete booking', 'DELETE_ERROR', 500, error.message);
  }
});

// ==================== CALENDAR ROUTES ====================
app.get('/api/calendar', authenticateToken, async (req, res) => {
  try {
    let { month, year } = req.query;
    month = parseInt(month) || new Date().getMonth() + 1;
    year = parseInt(year) || new Date().getFullYear();

    const [bookings] = await pool.execute(
      'SELECT id, first_name, last_name, event_date, status, package FROM bookings WHERE MONTH(event_date) = ? AND YEAR(event_date) = ? AND deleted_at IS NULL',
      [month, year]
    );

    const events = {};
    bookings.forEach(b => {
      const dateStr = b.event_date instanceof Date ? b.event_date.toISOString().split('T')[0] : String(b.event_date).split(' ')[0];
      if (!events[dateStr]) events[dateStr] = [];
      events[dateStr].push({ id: b.id, title: `${b.first_name} ${b.last_name}`, status: b.status, package: b.package });
    });

    sendResponse(res, { month, year, events, bookings }, 'Calendar data retrieved');
  } catch (error) {
    console.error('Calendar error:', error);
    sendError(res, 'Failed to load calendar', 'CALENDAR_ERROR', 500, error.message);
  }
});

// ==================== CLIENTS ROUTES ====================
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { search, limit = 10, offset = 0 } = req.query;
    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    const limitNum = parseInt(limit) || 10;
    const offsetNum = parseInt(offset) || 0;

    // Use query() instead of execute() for LIMIT/OFFSET compatibility
    const [clients] = await pool.query(
      `SELECT * FROM clients ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, offsetNum]
    );
    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM clients ${whereClause}`, params);

    sendResponse(res, { clients, total: countResult[0].total }, 'Clients retrieved');
  } catch (error) {
    sendError(res, 'Failed to load clients', 'CLIENTS_ERROR', 500, error.message);
  }
});

app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const [clients] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    sendResponse(res, { client: clients[0] || null }, 'Client retrieved');
  } catch (error) {
    sendError(res, 'Failed to retrieve client', 'CLIENT_ERROR', 500, error.message);
  }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { error: validationError } = clientSchema.validate(req.body);
    if (validationError) {
      return sendError(res, validationError.details[0].message, 'VALIDATION_ERROR', 400);
    }

    const { first_name, last_name, email, phone, address, notes } = req.body;
    await pool.execute(
      'INSERT INTO clients (first_name, last_name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, address, notes]
    );
    sendResponse(res, null, 'Client created successfully', 201);
  } catch (error) {
    console.error('Create client error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 'Email already exists', 'DUPLICATE_EMAIL', 400);
    }
    sendError(res, 'Failed to create client', 'CREATE_ERROR', 500, error.message);
  }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const values = fields.map(k => updates[k]);
    await pool.execute(`UPDATE clients SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`, [...values, req.params.id]);
    sendResponse(res, null, 'Client updated');
  } catch (error) {
    sendError(res, 'Failed to update client', 'UPDATE_ERROR', 500, error.message);
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    await pool.execute('DELETE FROM clients WHERE id = ?', [req.params.id]);
    sendResponse(res, null, 'Client deleted');
  } catch (error) {
    sendError(res, 'Failed to delete client', 'DELETE_ERROR', 500, error.message);
  }
});

// ==================== SETTINGS ====================
app.get('/api/settings', async (req, res) => {
  try {
    const [settings] = await pool.execute('SELECT setting_key, setting_value FROM settings');
    const settingsObj = {};
    settings.forEach(s => settingsObj[s.setting_key] = s.setting_value);
    sendResponse(res, { settings: settingsObj }, 'Settings retrieved');
  } catch (error) {
    sendError(res, 'Failed to load settings', 'SETTINGS_ERROR', 500, error.message);
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;
    const keys = Object.keys(settings);
    const values = Object.values(settings);

    for (const key of keys) {
      await pool.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, settings[key], settings[key]]
      );
    }
    sendResponse(res, null, 'Settings updated successfully');
  } catch (error) {
    sendError(res, 'Failed to update settings', 'SETTINGS_ERROR', 500, error.message);
  }
});

// ==================== UPLOAD ====================
app.post('/api/upload', authenticateToken, upload.array('images', 10), (req, res) => {
  try {
    const files = req.files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype
    }));
    sendResponse(res, { files }, 'Upload successful');
  } catch (error) {
    sendError(res, 'Upload failed', 'UPLOAD_ERROR', 500, error.message);
  }
});

// ==================== PUBLIC EVENTS ====================
app.get('/api/public-events/:id', async (req, res) => {
  try {
    const [events] = await pool.execute(
      'SELECT id, first_name, last_name, event_date, event_title, guests, venue, package, package_price, status FROM bookings WHERE id = ? AND status = "confirmed"',
      [req.params.id]
    );
    sendResponse(res, { booking: events[0] || null }, 'Event retrieved');
  } catch (error) {
    sendError(res, 'Failed to retrieve event', 'EVENT_ERROR', 500, error.message);
  }
});

// ==================== REPORTS ====================
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const { generate, type, period } = req.query;
    if (generate === '1') {
      const [reportData] = await pool.execute(
        `SELECT COUNT(*) as total_bookings, SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed, SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled, SUM(guests) as total_guests FROM bookings WHERE ${period === 'monthly' ? 'MONTH(created_at) = MONTH(CURRENT_DATE())' : 'YEAR(created_at) = YEAR(CURRENT_DATE())'}`
      );
      sendResponse(res, { report: reportData[0] }, 'Report generated');
    } else {
      sendResponse(res, { reports: [] }, 'Reports retrieved');
    }
  } catch (error) {
    sendError(res, 'Failed to generate report', 'REPORT_ERROR', 500, error.message);
  }
});

app.delete('/api/reports/:id', authenticateToken, async (req, res) => {
  sendResponse(res, null, 'Report deleted');
});

// ==================== ARCHIVE ====================
app.get('/api/archive', authenticateToken, async (req, res) => {
  try {
    const { action, type, search, limit = 50, offset = 0 } = req.query;
    
    if (action === 'list') {
      const limitNum = parseInt(limit) || 50;
      const offsetNum = parseInt(offset) || 0;
      
      if (type === 'bookings') {
        let whereClause = "WHERE record_type = 'bookings'";
        const params = [];
        
        if (search) {
          whereClause += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        const [archived] = await pool.query(
          `SELECT * FROM archive ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [...params, limitNum, offsetNum]
        );
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM archive WHERE record_type = 'bookings'`);
        sendResponse(res, { archived_bookings: archived, total: countResult[0].total }, 'Archive retrieved');
      } else if (type === 'messages') {
        let whereClause = "WHERE record_type = 'messages'";
        const params = [];
        
        if (search) {
          whereClause += " AND (name LIKE ? OR email LIKE ? OR subject LIKE ?)";
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        const [archived] = await pool.query(
          `SELECT * FROM archive ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [...params, limitNum, offsetNum]
        );
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM archive WHERE record_type = 'messages'`);
        sendResponse(res, { archived_messages: archived, total: countResult[0].total }, 'Archive retrieved');
      } else {
        sendResponse(res, { archived_bookings: [], archived_messages: [], total: 0 }, 'Archive retrieved');
      }
    } else {
      sendResponse(res, { archived_bookings: [], archived_messages: [], total: 0 }, 'Archive retrieved');
    }
  } catch (error) {
    console.error('Archive error:', error);
    sendError(res, 'Failed to load archive', 'ARCHIVE_ERROR', 500, error.message);
  }
});

app.post('/api/archive/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    
    if (type === 'bookings') {
      const [archived] = await pool.execute('SELECT * FROM archive WHERE id = ? AND record_type = ?', [id, 'bookings']);
      if (archived.length > 0) {
        const a = archived[0];
        await pool.execute(
          `INSERT INTO bookings (id, client_id, first_name, last_name, email, phone, event_date, event_title, guests, venue, package, package_price, special_requests, images, status, deleted_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), email = VALUES(email), phone = VALUES(phone), event_date = VALUES(event_date), event_title = VALUES(event_title), guests = VALUES(guests), venue = VALUES(venue), package = VALUES(package), package_price = VALUES(package_price), special_requests = VALUES(special_requests), images = VALUES(images), status = VALUES(status), deleted_at = NULL, updated_at = CURRENT_TIMESTAMP`,
          [a.original_id, null, a.first_name, a.last_name, a.email, a.phone, a.event_date, a.event_title, a.guests, a.venue, a.package, a.package_price, a.special_requests, a.images, a.status, null, a.original_created_at, a.original_updated_at]
        );
      }
      await pool.execute('DELETE FROM archive WHERE id = ? AND record_type = ?', [id, 'bookings']);
    } else if (type === 'messages') {
      const [archived] = await pool.execute('SELECT * FROM archive WHERE id = ? AND record_type = ?', [id, 'messages']);
      if (archived.length > 0) {
        const a = archived[0];
        await pool.execute(
          `INSERT INTO messages (id, name, email, phone, subject, message, status, rating, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone), subject = VALUES(subject), message = VALUES(message), status = VALUES(status), rating = VALUES(rating), updated_at = CURRENT_TIMESTAMP`,
          [a.original_id, a.name, a.email, a.phone, a.subject, a.message, a.status || 'read', a.rating || null, a.original_created_at, a.original_updated_at]
        );
      }
      await pool.execute('DELETE FROM archive WHERE id = ? AND record_type = ?', [id, 'messages']);
    }
    sendResponse(res, null, 'Restored successfully');
  } catch (error) {
    sendError(res, 'Failed to restore', 'RESTORE_ERROR', 500, error.message);
  }
});

app.delete('/api/archive/:id', authenticateToken, async (req, res) => {
  try {
    const { type } = req.body;
    if (type === 'bookings') {
      await pool.execute('DELETE FROM archive WHERE id = ? AND record_type = ?', [req.params.id, 'bookings']);
    } else if (type === 'messages') {
      await pool.execute('DELETE FROM archive WHERE id = ? AND record_type = ?', [req.params.id, 'messages']);
    }
    sendResponse(res, null, 'Deleted permanently');
  } catch (error) {
    sendError(res, 'Failed to delete permanently', 'DELETE_ERROR', 500, error.message);
  }
});

// ==================== AUDIT ====================
app.get('/api/audit', authenticateToken, async (req, res) => {
  try {
    const { search, date_from, date_to, activity_type, limit = 10, offset = 0 } = req.query;
    let whereClause = '1=1';
    let params = [];
    if (search) { whereClause += ' AND (activity LIKE ? OR details LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (activity_type) { whereClause += ' AND activity = ?'; params.push(activity_type); }
    if (date_from) { whereClause += ' AND created_at >= ?'; params.push(date_from); }
    if (date_to) { whereClause += ' AND created_at <= ?'; params.push(date_to); }
    const limitNum = parseInt(limit) || 10;
    const offsetNum = parseInt(offset) || 0;
    // Use query() instead of execute() for LIMIT/OFFSET compatibility
    const [logs] = await pool.query(
      `SELECT * FROM audit_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, offsetNum]
    );
    sendResponse(res, { audit_logs: logs }, 'Audit logs retrieved');
  } catch (error) {
    sendError(res, 'Failed to load audit logs', 'AUDIT_ERROR', 500, error.message);
  }
});

app.post('/api/audit', authenticateToken, async (req, res) => {
  try {
    const { activity, details } = req.body;
    await pool.execute(
      'INSERT INTO audit_logs (activity, details, user_id) VALUES (?, ?, ?)',
      [activity, details, req.user?.id || 0]
    );
    sendResponse(res, null, 'Audit log created', 201);
  } catch (error) {
    sendError(res, 'Failed to create audit log', 'AUDIT_ERROR', 500, error.message);
  }
});

// ==================== USERS (Admin Accounts) ====================
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, limit = 10, offset = 0 } = req.query;
    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE (username LIKE ? OR email LIKE ?) ';
      params = [`%${search}%`, `%${search}%`];
    }

    const limitNum = parseInt(limit) || 10;
    const offsetNum = parseInt(offset) || 0;

    // Use query() instead of execute() for LIMIT/OFFSET compatibility
    const [users] = await pool.query(
      `SELECT id, username, email, role, profile_image, created_at FROM users ${whereClause}ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, offsetNum]
    );
    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);

    sendResponse(res, { users, total: countResult[0].total }, 'Users retrieved');
  } catch (error) {
    sendError(res, 'Failed to load users', 'USERS_ERROR', 500, error.message);
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, profile_image, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    sendResponse(res, { user: users[0] || null }, 'User retrieved');
  } catch (error) {
    sendError(res, 'Failed to retrieve user', 'USER_ERROR', 500, error.message);
  }
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error: validationError } = userSchema.validate(req.body);
    if (validationError) {
      return sendError(res, validationError.details[0].message, 'VALIDATION_ERROR', 400);
    }

    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    await pool.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'staff']
    );
    sendResponse(res, null, 'User created successfully', 201);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 'Username or email already exists', 'DUPLICATE_USER', 400);
    }
    sendError(res, 'Failed to create user', 'CREATE_ERROR', 500, error.message);
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.execute(
        'UPDATE users SET username = ?, email = ?, password_hash = ?, role = ? WHERE id = ?',
        [username, email, hashedPassword, role, req.params.id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
        [username, email, role, req.params.id]
      );
    }
    sendResponse(res, null, 'User updated successfully');
  } catch (error) {
    sendError(res, 'Failed to update user', 'UPDATE_ERROR', 500, error.message);
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    sendResponse(res, null, 'User deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete user', 'DELETE_ERROR', 500, error.message);
  }
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isDev = process.env.NODE_ENV !== 'production';
  sendError(res, err.message || 'Something went wrong!', 'INTERNAL_ERROR', 500, isDev ? err.stack : null);
});

// ==================== PROFILE ROUTES ====================
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, role, first_name, last_name, phone, profile_image, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return sendError(res, 'User not found', 'NOT_FOUND', 404);
    }
    sendResponse(res, { profile: users[0] }, 'Profile');
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Failed to get profile', 'PROFILE_ERROR', 500);
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, phone, profile_image } = req.body;
    await pool.execute(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ?, profile_image = ? WHERE id = ?',
      [first_name, last_name, phone, profile_image, req.user.id]
    );
    sendResponse(res, null, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 'Failed to update profile', 'UPDATE_ERROR', 500);
  }
});

// ==================== MESSAGES ROUTES ====================
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const [messages] = await pool.execute(
      'SELECT * FROM messages ORDER BY created_at DESC'
    );
    sendResponse(res, { messages, total: messages.length }, 'Messages');
  } catch (error) {
    console.error('Get messages error:', error);
    sendError(res, 'Failed to get messages', 'MESSAGES_ERROR', 500);
  }
});

app.get('/api/messages/:id', authenticateToken, async (req, res) => {
  try {
    const [messages] = await pool.execute('SELECT * FROM messages WHERE id = ?', [req.params.id]);
    if (messages.length === 0) {
      return sendError(res, 'Message not found', 'NOT_FOUND', 404);
    }
    sendResponse(res, { message: messages[0] }, 'Message');
  } catch (error) {
    console.error('Get message error:', error);
    sendError(res, 'Failed to get message', 'MESSAGE_ERROR', 500);
  }
});

app.put('/api/messages/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.execute('UPDATE messages SET status = ? WHERE id = ?', [status, req.params.id]);
    sendResponse(res, null, 'Message updated successfully');
  } catch (error) {
    console.error('Update message error:', error);
    sendError(res, 'Failed to update message', 'UPDATE_ERROR', 500);
  }
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
  try {
    await pool.execute('DELETE FROM messages WHERE id = ?', [req.params.id]);
    sendResponse(res, null, 'Message deleted successfully');
  } catch (error) {
    console.error('Delete message error:', error);
    sendError(res, 'Failed to delete message', 'DELETE_ERROR', 500);
  }
});

// ==================== EXPENSES ROUTES ====================
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const [expenses] = await pool.execute('SELECT * FROM expenses ORDER BY created_at DESC');
    sendResponse(res, { expenses, total: expenses.length }, 'Expenses');
  } catch (error) {
    console.error('Get expenses error:', error);
    sendResponse(res, { expenses: [], total: 0 }, 'Expenses');
  }
});

app.get('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const [expenses] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (expenses.length === 0) {
      return sendError(res, 'Expense not found', 'NOT_FOUND', 404);
    }
    sendResponse(res, { expense: expenses[0] }, 'Expense');
  } catch (error) {
    console.error('Get expense error:', error);
    sendError(res, 'Failed to get expense', 'EXPENSE_ERROR', 500);
  }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { category, description, amount, payment_method, expense_date } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO expenses (category, description, amount, payment_method, expense_date, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [category, description, amount, payment_method, expense_date]
    );
    sendResponse(res, { expense: { id: result.insertId, category, description, amount } }, 'Expense created');
  } catch (error) {
    console.error('Create expense error:', error);
    sendError(res, 'Failed to create expense', 'CREATE_ERROR', 500);
  }
});

app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { category, description, amount, payment_method, expense_date } = req.body;
    await pool.execute(
      'UPDATE expenses SET category = ?, description = ?, amount = ?, payment_method = ?, expense_date = ? WHERE id = ?',
      [category, description, amount, payment_method, expense_date, req.params.id]
    );
    sendResponse(res, null, 'Expense updated successfully');
  } catch (error) {
    console.error('Update expense error:', error);
    sendError(res, 'Failed to update expense', 'UPDATE_ERROR', 500);
  }
});

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    await pool.execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    sendResponse(res, null, 'Expense deleted successfully');
  } catch (error) {
    console.error('Delete expense error:', error);
    sendError(res, 'Failed to delete expense', 'DELETE_ERROR', 500);
  }
});

// ==================== PAYMENTS ROUTES ====================
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const [payments] = await pool.execute('SELECT * FROM payments ORDER BY created_at DESC');
    sendResponse(res, { payments, total: payments.length }, 'Payments');
  } catch (error) {
    console.error('Get payments error:', error);
    sendResponse(res, { payments: [], total: 0 }, 'Payments');
  }
});

app.get('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const [payments] = await pool.execute('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (payments.length === 0) {
      return sendError(res, 'Payment not found', 'NOT_FOUND', 404);
    }
    sendResponse(res, { payment: payments[0] }, 'Payment');
  } catch (error) {
    console.error('Get payment error:', error);
    sendError(res, 'Failed to get payment', 'PAYMENT_ERROR', 500);
  }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { booking_id, amount, payment_method, payment_status, transaction_reference, payment_date } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_reference, payment_date, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [booking_id, amount, payment_method, payment_status, transaction_reference, payment_date]
    );
    sendResponse(res, { payment: { id: result.insertId, booking_id, amount, payment_method } }, 'Payment created');
  } catch (error) {
    console.error('Create payment error:', error);
    sendError(res, 'Failed to create payment', 'CREATE_ERROR', 500);
  }
});

app.put('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { payment_status, transaction_reference } = req.body;
    await pool.execute(
      'UPDATE payments SET payment_status = ?, transaction_reference = ? WHERE id = ?',
      [payment_status, transaction_reference, req.params.id]
    );
    sendResponse(res, null, 'Payment updated successfully');
  } catch (error) {
    console.error('Update payment error:', error);
    sendError(res, 'Failed to update payment', 'UPDATE_ERROR', 500);
  }
});

app.use((req, res) => {
  sendError(res, 'Route not found', 'NOT_FOUND', 404);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed');
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server - only when not running on Vercel (Vercel uses the exported app)
if (process.env.VERCEL === undefined) {
  app.listen(PORT, async () => {
    console.log(`Baby Bliss API Server running on port ${PORT}`);
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log('Database connected successfully');
    } else {
      console.log('Database connection failed - check your .env configuration');
    }
  });
}

// Export app for Vercel serverless functions
module.exports = app;
