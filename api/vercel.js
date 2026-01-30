// Vercel API Handler - Wraps Express app for serverless deployment
import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import nodemailer from 'nodemailer';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

// JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// Response helpers
const sendResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res, message, code = 'ERROR', statusCode = 500, details = null) => {
  res.status(statusCode).json({
    success: false,
    error: { message, code, ...(details && { details }) }
  });
};

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baby_bliss',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 25,
  queueLimit: 0,
  connectTimeout: 10000
});

// JWT Authentication
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
    return sendError(res, 'Invalid token', 'INVALID_TOKEN', 403);
  }
};

// Health check
app.get('/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Baby Bliss API Server', status: 'running' });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
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

// Settings endpoint
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      general_site_title: 'Baby Bliss',
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
});

// Vercel serverless handler
export default (req, res) => {
  app(req, res);
};
