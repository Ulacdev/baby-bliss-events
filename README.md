# Baby Bliss Events Management System

A full-stack event management application for Baby Bliss Events with both PHP and Node.js backend options.

## Project Structure

- **Frontend**: React + TypeScript + Vite (in `/` root)
- **Backend Options**:
  - PHP Backend (traditional, requires XAMPP/WAMP)
  - Node.js Backend (modern, Vercel-compatible in `/backend`)

## Quick Start

### Frontend Only (Local Development)

```bash
npm install
npm run dev
```

This runs the React frontend with mock API responses.

### Full Stack with PHP Backend

1. Set up XAMPP/WAMP with PHP and MySQL
2. Place PHP files in `htdocs/api/` directory
3. Import `database.sql`
4. Run `npm run dev` for frontend

### Full Stack with Node.js Backend (Vercel Ready)

1. Install frontend dependencies: `npm install`
2. Install backend dependencies: `cd backend && npm install`
3. Run backend: `cd backend && npm run dev`
4. Run frontend: `npm run dev` (in separate terminal)
5. Update `src/integrations/api/client.ts` API_BASE_URL to `http://localhost:3001`

## Backend Options

### PHP Backend (api/ folder)

- Traditional LAMP stack
- Requires XAMPP/WAMP
- Good for local development
- Not suitable for Vercel

### Node.js Backend (backend/ folder)

- Modern Express.js server
- Vercel-compatible
- Serverless ready
- Better performance

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/504d36d8-0e71-4322-b276-e10d9a81da29) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Frontend**: React + TypeScript + Vite + shadcn-ui + Tailwind CSS
- **Backend**: Node.js + Express + MySQL + JWT Authentication
- **Database**: MySQL (PlanetScale/Railway compatible)
- **Deployment**: Vercel (Frontend + API routes)

## How can I deploy this project?

### Option 1: Vercel (Recommended)

See `VERCEL_DEPLOYMENT.md` for complete deployment guide.

**Quick Deploy:**

1. Push code to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy automatically

### Option 2: Lovable

Simply open [Lovable](https://lovable.dev/projects/504d36d8-0e71-4322-b276-e10d9a81da29) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
