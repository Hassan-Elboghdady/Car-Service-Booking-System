# Car Service Booking System

This project is a Node.js + Express + MongoDB booking system backend with EJS views.

## What It Does

The app manages users, cars, bookings, contact messages, issues, reviews, inventory, brands, services, and chat.

- `GET /` and `/page` routes render EJS views.
- API routes are mounted under `/api/*`.
- `POST /api/contact` submits a contact message.
- `POST /api/reviews` submits a review (authenticated users).
- Admin-only review and contact management routes exist.

## Folder Structure

- `models/` - Mongoose schemas
- `controllers/` - request logic
- `routes/` - API endpoints
- `config/` - database connection
- `middleware/` - shared auth and error handling
- `views/` - EJS templates
- `public/` - static CSS, JS, and images

## Setup

1. Install Node.js if not already installed.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and update values.
4. Start MongoDB locally or update `MONGODB_URI`.
5. Run `npm run dev`.

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/webprojectcar_demo
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
GROQ_API_KEY=your_groq_api_key
HTTPS_KEY_PATH=path/to/privkey.pem
HTTPS_CERT_PATH=path/to/fullchain.pem
```

## Vercel Deployment

- The project now includes `vercel.json` and `api/index.js` for Vercel deployment.
- Push the repo to GitHub, import it in Vercel, and deploy with the default settings.
- Vercel will handle HTTPS automatically for the deployed app.
- The local HTTPS settings above are only needed if you want to run HTTPS on your own machine.

## Notes

- `server.js` loads environment variables with `dotenv` and connects to MongoDB.
- `app.js` sets up routes and centralized error handling.
- `middleware/authMiddleware.js` protects routes using JWT tokens.
- `.gitignore` excludes `node_modules` and `.env`.