# Vercel Deployment Guide for Baby Bliss

This guide shows how to deploy both the frontend and backend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Set up a MySQL database (PlanetScale, Railway, or AWS RDS)
3. **Git Repository**: Push your code to GitHub/GitLab

## Database Setup

### Option 1: PlanetScale (Recommended for Vercel)

1. Create account at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Import the `database.sql` file
4. Copy the connection details

### Option 2: Railway

1. Create account at [railway.app](https://railway.app)
2. Create MySQL database
3. Import `database.sql`
4. Get connection credentials

## Backend Deployment

### Step 1: Create Backend Repository

1. Create a new GitHub repository (e.g., `baby-bliss-backend`)
2. Copy only the backend files:
   ```
   backend/
   database.sql
   ```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your backend repository
4. Configure environment variables:
   ```
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=baby_bliss
   DB_PORT=3306
   JWT_SECRET=your-secure-jwt-secret
   ```
5. Deploy

### Step 3: Get Backend URL

After deployment, copy the Vercel URL (e.g., `https://baby-bliss-backend.vercel.app`)

## Frontend Deployment

### Step 1: Update Frontend Configuration

1. In your frontend repository, update `vercel.json`:

   ```json
   {
     "env": {
       "VITE_API_BASE_URL": "https://your-backend-url.vercel.app"
     }
   }
   ```

2. Update `.env` for local development:
   ```
   VITE_API_BASE_URL=http://localhost:3001
   ```

### Step 2: Deploy Frontend

1. Create a new Vercel project
2. Import your frontend repository
3. Vercel will auto-detect it's a Vite project
4. Set the environment variable: `VITE_API_BASE_URL=https://your-backend-url.vercel.app`
5. Deploy

## Testing Deployment

1. **Frontend**: Visit your Vercel frontend URL
2. **API Test**: Visit `https://your-backend-url.vercel.app/api/dashboard`
3. **Login**: Try logging in with `admin@babybliss.com` / `admin123`

## Environment Variables Summary

### Backend (.env)

```
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=baby_bliss
DB_PORT=3306
JWT_SECRET=your-secure-random-string
```

### Frontend (.env)

```
VITE_API_BASE_URL=https://your-backend.vercel.app
```

## Troubleshooting

### Database Connection Issues

- Ensure your database allows connections from `0.0.0.0/0` (PlanetScale does this automatically)
- Check firewall settings
- Verify credentials

### API 404 Errors

- Ensure API routes are configured correctly in backend/
- Check Vercel function logs
- Verify environment variables are set

### CORS Issues

- Vercel handles CORS automatically for API routes
- If issues persist, check your API route headers

## File Structure for Deployment

```
baby-bliss-frontend/     # Frontend Vercel project
├── src/                 # React source
├── public/              # Static assets
├── package.json
├── vercel.json
└── .env

baby-bliss-backend/      # Backend Vercel project (optional separate)
├── backend/              # Express.js server
├── package.json
└── database.sql
```

## Cost Estimation

- **Vercel Hobby Plan**: Free for personal projects
- **Database**: PlanetScale free tier, Railway ~$5/month
- **Domain**: Optional, ~$15/year

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Check API routes are working</content>
   </xai:function_call">VERCEL_DEPLOYMENT.md
