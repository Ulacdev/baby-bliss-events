# Baby Bliss - XAMPP Setup Guide

This guide explains how to run the Baby Bliss frontend with XAMPP and MySQL instead of Supabase.

## Prerequisites

- XAMPP installed and running
- PHP 7.4+ (included with XAMPP)
- MySQL (included with XAMPP)

## Setup Steps

### 1. Database Setup

1. Start XAMPP and ensure Apache and MySQL are running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create a new database named `baby_bliss`
4. Import the database schema:
   - Go to the Import tab
   - Select the `api/database.sql` file
   - Click Go

### 2. Configure API

1. Copy the entire `api` folder to your XAMPP htdocs directory:
   ```
   C:\xampp\htdocs\api\
   ```

2. The API will be accessible at: `http://localhost/api/`

### 3. Configure Frontend

The frontend is already configured to use the local API. The API client is set to:
```typescript
const API_BASE_URL = 'http://localhost/api';
```

### 4. Build and Serve Frontend

Since this is a Vite React app, you have two options:

#### Option A: Development Server (Recommended)
```bash
npm run dev
```
The app will run on `http://localhost:5173`

#### Option B: Build for Production
```bash
npm run build
```
Then copy the `dist` folder contents to `C:\xampp\htdocs\baby-bliss\` and access at `http://localhost/baby-bliss/`

## Default Admin Account

- Email: `admin@babybliss.com`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth.php?action=login` - Login
- `POST /api/auth.php?action=signup` - Register
- `POST /api/auth.php?action=logout` - Logout
- `GET /api/auth.php?action=session` - Get session

### Bookings
- `GET /api/bookings.php` - Get all bookings
- `GET /api/bookings.php?id={id}` - Get specific booking
- `POST /api/bookings.php` - Create booking
- `PUT /api/bookings.php?id={id}` - Update booking
- `DELETE /api/bookings.php?id={id}` - Delete booking

## Troubleshooting

1. **CORS Issues**: Ensure the `.htaccess` file is properly configured
2. **Database Connection**: Check MySQL credentials in `api/config.php`
3. **API Not Found**: Ensure the API folder is in `C:\xampp\htdocs\api\`
4. **Session Issues**: Make sure PHP sessions are working (check php.ini)

## Security Notes

- This setup is for development only
- In production, implement proper JWT tokens instead of PHP sessions
- Add input validation and sanitization
- Use HTTPS in production
- Configure proper CORS policies