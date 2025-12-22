const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baby_bliss',
  port: process.env.DB_PORT || 3306,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;

  try {
    const connection = await mysql.createConnection(dbConfig);

    if (action === 'login') {
      const { email, password } = req.body;

      // Get user from database
      const [users] = await connection.execute(
        'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ? AND status = "active"',
        [email]
      );

      if (users.length === 0) {
        await connection.end();
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await connection.end();
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      await connection.end();
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
        await connection.end();
        return res.json({ user: null, session: null });
      }

      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

        const [users] = await connection.execute(
          'SELECT id, email, first_name, last_name, role FROM users WHERE id = ? AND status = "active"',
          [decoded.id]
        );

        await connection.end();

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
        await connection.end();
        res.json({ user: null, session: null });
      }
    } else {
      await connection.end();
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}