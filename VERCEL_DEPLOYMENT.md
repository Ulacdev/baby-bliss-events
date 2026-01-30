# Vercel Deployment Guide for Baby Bliss

This guide shows how to deploy both the frontend and backend to Vercel using the combined API routes approach.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MySQL Database**: Set up a MySQL database (PlanetScale, Railway, or AWS RDS)

## Database Setup

### Option 1: PlanetScale (Recommended)

1. Create account at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Import the `database.sql` file
4. Get connection details (host, username, password)

### Option 2: Railway

1. Create account at [railway.app](https://railway.app)
2. Create MySQL database
3. Import `database.sql`
4. Get connection credentials from the Railway dashboard

## Deployment Steps

### Step 1: Push Code to GitHub

Ensure your code is pushed to GitHub with all the Vercel configuration files:

- `vercel.json` - Configured for frontend + API routes
- `api/vercel.js` - Express app wrapper for Vercel
- `.env.example` - Environment variable template

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository

### Step 3: Configure Environment Variables

In the Vercel dashboard, go to **Settings > Environment Variables** and add:

**Backend Variables:**

```
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=baby_bliss
DB_PORT=3306
JWT_SECRET=your-secure-random-string (at least 32 chars)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
FRONTEND_URL=https://your-project.vercel.app
```

**Frontend Variables:**

```
VITE_API_BASE_URL=https://your-project.vercel.app
```

### Step 4: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. You'll get a URL like: `https://baby-bliss-events.vercel.app`

## Testing the Deployment

1. **Frontend**: Visit your Vercel URL
2. **API Test**: Visit `https://your-url.vercel.app/api/dashboard`
3. **Login**: Try logging in with your admin credentials

## API Endpoints

After deployment, all API endpoints will be available at:

- `https://your-url.vercel.app/api/auth/login`
- `https://your-url.vercel.app/api/bookings`
- `https://your-url.vercel.app/api/users`
- `https://your-url.vercel.app/api/messages`
- etc.

## Troubleshooting

### Database Connection Issues

- Ensure your database allows connections from Vercel's IPs
- Check that all DB credentials are correctly set in Vercel
- For PlanetScale, use the connection string format

### CORS Errors

- Ensure `FRONTEND_URL` is set to your Vercel frontend URL
- Check that credentials are allowed in CORS config

### 404 on API Routes

- Ensure the `api/vercel.js` file exists
- Check that `vercel.json` has the correct rewrites
- Verify the build output includes the API folder

## File Structure

```
project-root/
├── api/
│   └── vercel.js          # Express app wrapper
├── backend/
│   ├── server.js          # Express server (local)
│   └── ...
├── src/                   # React frontend
├── vercel.json            # Vercel configuration
└── .env.example           # Environment template
```

## Cost Estimation

- **Vercel Hobby Plan**: Free
- **PlanetScale Free Tier**: Free
- **Railway Starter**: ~$5/month

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Check the browser console for errors
