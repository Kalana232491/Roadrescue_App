# Roadrescue_App
This s a full-stack platform that connects drivers with verified roadside assistance providers, service suplliers. This project  is not complete. THere are still a few more features to add.

## Repository Layout
- `backend/` – Express 5 API, authentication and provider management, PostgreSQL migrations
- `front/` – React 19 + Vite single-page app with Tailwind UI and React Query data layer

## Core Features
- Location-aware provider search with Google Maps integration and distance filtering
- Provider onboarding with profile, service type, photo gallery, and accessory catalog management
- JWT-secured authentication for recipients, providers, and admins
- Admin dashboard for approving provider submissions and managing user accounts
- Ratings and review system that surfaces trusted providers to drivers

## Tech Stack
- **Backend:** Node.js, Express 5, PostgreSQL, JWT, Multer, bcrypt, Helmet, CORS
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Radix UI, React Router, React Query, Axios
- **Tooling:** ESLint, TypeScript, Vite build pipeline

## Prerequisites
- Node.js 18+ (Node 20 LTS recommended)
- npm 9+ (bundled with Node)
- PostgreSQL 14+ running locally or accessible over the network
- Google Maps JavaScript API key (required for map picker in the provider portal)

## Environment Variables
The backend reads configuration from `backend/.env`. Duplicate this file (for example to `backend/.env.local`) and adjust for your environment.

| Variable | Description |
| --- | --- |
| `PORT` | Port the API listens on (defaults to 4000) |
| `NODE_ENV` | `development`/`production` flag used for logging |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` | PostgreSQL connection settings |
| `UPLOAD_DIR` | Relative path for storing uploaded files (defaults to `./uploads`) |
| `BASE_URL` | Public origin for serving uploaded assets |

> **Security note:** Never commit real secrets. Use local overrides or your deployment platform's secret manager in production.

## Backend Setup
1. Install dependencies:
   ```powershell
   cd backend
   npm install
   ```
2. Ensure your PostgreSQL database exists (for example `createdb roadrescue`).
3. Populate environment variables as described above.
4. Run the SQL migrations to create tables and indexes:
   ```powershell
   npm run db:migrate
   ```
5. Start the development server (with hot reload via `node --watch`):
   ```powershell
   npm run dev
   ```
   The API will be available at `http://localhost:4000/api`.

## Frontend Setup
1. Install dependencies:
   ```powershell
   cd front
   npm install
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   By default the app runs at `http://localhost:5173` and proxies API requests to `http://localhost:4000/api` (see `src/lib/api.ts`).
3. When prompted in the UI, supply your Google Maps JavaScript API key so provider location features work. The key is saved to `localStorage` for convenience.

## Running the Full Stack
- Launch the backend and frontend in separate terminals as shown above.
- Ensure the backend `UPLOAD_DIR` exists (create it manually if missing) so file uploads succeed.
- For production deployments, configure HTTPS and update `front/src/lib/api.ts` to point at your hosted API URL or refactor it to read from an environment variable (for example `import.meta.env.VITE_API_BASE`).

## Available Scripts
### Backend (`backend/package.json`)
- `npm run dev` – start API with file watching
- `npm start` – start API without watching (production)
- `npm run db:migrate` – execute SQL migrations in `src/sql`

### Frontend (`front/package.json`)
- `npm run dev` – start Vite dev server with hot module replacement
- `npm run build` – build production bundles into `front/dist`
- `npm run build:dev` – build using Vite's development mode configuration
- `npm run preview` – serve the built assets locally
- `npm run lint` – run ESLint with the project's TypeScript config

## Database Notes
- Migrations live in `backend/src/sql`. Adjust or append new migration files, then update `run-migrations.js` if you change the execution order.
- The default schema includes users, provider profiles, provider service types, accessory listings, and review tables. Check `001_init.sql` for the full definition before making changes.

## Next Steps
- Seed the database with sample users and providers for easier demos.
- Externalize the frontend API base URL and Maps API key into environment variables for production builds.
- Add automated tests (unit/integration) to cover critical auth and provider workflows before shipping.
