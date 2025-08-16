# Deployment Guide

## Quick Deployment Options

### Option 1: Deploy to Netlify + Railway (Recommended)

#### Backend (Railway - Free Tier)
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select your `interior-design-matcher` repository
5. Railway will auto-detect the Node.js backend in the `/backend` folder
6. Set environment variables:
   - `PORT=5000` (Railway provides this automatically)
   - Add any other env vars your backend needs
7. Deploy - Railway will give you a URL like `https://your-app-name.railway.app`

#### Frontend (Netlify - Free Tier)
1. Go to [Netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Import from Git"
4. Select your repository
5. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
6. Set environment variable:
   - `REACT_APP_API_URL=https://your-railway-backend-url.railway.app/api`
7. Deploy - Netlify will give you a URL like `https://amazing-name-123.netlify.app`

### Option 2: Deploy to Vercel (Alternative)

#### Frontend
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel auto-detects React
4. Set environment variable: `REACT_APP_API_URL=https://your-backend-url/api`
5. Deploy

#### Backend
Use Railway (as above) or Heroku for the backend.

### Option 3: All-in-One with Render

1. Go to [Render.com](https://render.com)
2. Create two services:
   - **Web Service** for backend (Node.js)
   - **Static Site** for frontend (React)
3. Connect both to your GitHub repo
4. Configure build paths and environment variables

## Environment Variables Needed

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### Backend (.env)
```
PORT=5000
NODE_ENV=production
# Add any other backend environment variables
```

## Local Testing

You can test the production build locally:

```bash
# Build the frontend
npm run build

# Serve the production build
npx serve -s build -l 3000

# In another terminal, start the backend
cd backend
PORT=5001 node src/server.js
```

## Notes

- The image loading issue you mentioned will be resolved once deployed, as the scraped images will be accessible from the web
- Both frontend and backend need to be deployed separately
- Update CORS settings in your backend to allow your frontend domain
- Consider adding a custom domain later if needed

## Quick Start (5 minutes)

1. Push your code to GitHub
2. Deploy backend to Railway (2 mins)
3. Deploy frontend to Netlify with Railway backend URL (2 mins)
4. Test your live application!

Your interior design helper will be accessible worldwide with all the new features working perfectly.