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
    const { rows: settings } = await pool.query('SELECT setting_key, setting_value FROM settings');

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Settings API error:', error);
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
}