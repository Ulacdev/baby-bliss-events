# Baby Bliss Backend (Node.js/Express)

This is the Node.js/Express version of the Baby Bliss API backend, designed to work with Vercel deployment.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```env
PORT=3001
NODE_ENV=development
# Add your database and other configuration here
```

3. Run the server:

```bash
npm run dev  # Development with nodemon
npm start    # Production
```

## API Endpoints

The server provides the same endpoints as the PHP version:

- `POST /api/auth.php` - Authentication
- `GET /api/dashboard.php` - Dashboard stats
- `GET /api/settings.php` - App settings
- `GET /api/bookings.php` - Bookings data
- And more...

## Deployment to Vercel

1. Push this backend folder to a separate Vercel project
2. Set environment variables in Vercel dashboard
3. Update your frontend's `API_BASE_URL` to point to the Vercel deployment URL

## Features

- Express.js server
- CORS enabled
- Security middleware (Helmet)
- Request logging (Morgan)
- Mock data for testing
- Ready for database integration</content>
  </xai:function_call">backend/README.md
