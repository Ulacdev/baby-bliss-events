# Deployment Plan: Baby Bliss App

## Overview
Deploy the Baby Bliss application with the following architecture:
- **Frontend**: Vercel (React/Vite)
- **Backend**: Render (Node.js/Express)
- **Database**: Clever Cloud (MySQL)

## Prerequisites
- Clever Cloud account
- Render account
- Vercel account
- Database schema (database.sql)

## Step 1: Database Setup (Clever Cloud)
1. Create a Clever Cloud account at https://www.clever-cloud.com/
2. Create a new MySQL add-on
3. Note the connection details:
   - Host
   - Database name
   - Username
   - Password
   - Port

## Step 2: Backend Preparation
1. Update `backend/.env` with production database credentials
2. Ensure `backend/package.json` has correct scripts
3. Add `backend/vercel.json` or `render.yaml` if needed
4. Test backend locally with production DB

## Step 3: Backend Deployment (Render)
1. Create a Render account at https://render.com/
2. Connect GitHub repository
3. Create a new Web Service for the backend
4. Set environment variables:
   - DB_HOST
   - DB_USER
   - DB_PASSWORD
   - DB_NAME
   - DB_PORT
   - JWT_SECRET
5. Deploy

## Step 4: Frontend Preparation
1. Update `src/integrations/api/client.ts` to use production API URL
2. Or set VITE_API_BASE_URL in Vercel environment
3. Ensure build works: `npm run build`

## Step 5: Frontend Deployment (Vercel)
1. Create a Vercel account at https://vercel.com/
2. Connect GitHub repository
3. Set environment variables:
   - VITE_API_BASE_URL (pointing to Render backend)
4. Deploy

## Step 6: Testing
1. Test frontend loads
2. Test API calls work
3. Test database operations

## Configuration Details

### Backend Environment Variables
```
DB_HOST=your-clever-cloud-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=3306
JWT_SECRET=your-secure-jwt-secret
PORT=10000 (or Render's default)
```

### Frontend Environment Variables
```
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

## Potential Issues
- CORS configuration for production
- Database connection timeouts
- Environment variable naming
- Build failures due to missing dependencies