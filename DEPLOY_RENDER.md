# Deploying to Render

This project is configured for deployment on [Render.com](https://render.com).

## Prerequisites

1. A Render account (free tier available)
2. A PostgreSQL database (can be created on Render's free tier)
3. Environment variables configured

## Deployment Steps

### 1. Create a PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "PostgreSQL"
3. Choose a name and region
4. Select the free tier (limited to 90 days of inactivity)
5. Click "Create Database"
6. Copy the **Internal Database URL** (you'll need this)

### 2. Deploy the Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the settings:
   - **Name**: personal-expense-tracker (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free tier available

### 3. Configure Environment Variables

In the Render dashboard, add the following environment variables:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=<generate-a-strong-random-string>
DATABASE_URL=<your-postgres-internal-database-url>
CORS_ORIGIN=<your-render-app-url>
VITE_API_URL=https://<your-render-app-url>
```

To generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Initial Setup

After your service deploys, the database tables will be automatically created on first startup.

## Important Notes

- **Free Tier Limitations**: Render's free tier databases are put to sleep after 15 minutes of inactivity. On first access after sleeping, there will be a ~30 second delay.
- **Database Retention**: Free databases are deleted after 90 days of inactivity
- **Secure Cookies**: On Render (production), cookies are automatically set with `secure: true` for HTTPS
- **Static Files**: The built Vite application is served automatically by the Express server

## Troubleshooting

### Build Fails
- Check that all dependencies are correctly specified in `package.json`
- Ensure `npm run build` completes successfully locally
- Check the build logs in the Render dashboard

### Database Connection Error
- Verify `DATABASE_URL` is correctly set
- Ensure the database is still active (check Render dashboard)
- For free tier, wake up the database by visiting the app

### Blank Page or 404 Errors
- Ensure `npm run build` completed and created the `dist` folder
- Check that `server/index.js` is serving static files correctly
- Verify the API endpoints are accessible at `/api/*`

## Development

For local development, create a `.env` file:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expense_tracker
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
VITE_API_URL=http://localhost:3001
```

Then run:
```bash
npm install
npm run dev
```

## Architecture

- **Frontend**: React 19 with Vite, TypeScript, Tailwind CSS
- **Backend**: Express.js with PostgreSQL
- **Database**: PostgreSQL
- **Authentication**: JWT tokens stored in httpOnly cookies
- **Deployment**: Render.com (Node.js + PostgreSQL)

The built React app is served as static files from the Express server, making it a single deployment unit.
