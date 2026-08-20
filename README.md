# Motion Mastery

A workout tracking web app for logging exercises and following your fitness journey progress over time.

I built Motion Mastery to combine one of my passions of fitness with learning how a full-stack application actually works. My goal was to understand how the frontend and backend connect: authentication, protected routes, database modeling, and API design.

**Status:** Learning project. Authentication, protected APIs, and workout creation are functional. Several UI pages (goals, stats, home) are partially built or stubbed.

---

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken) for auth
- bcrypt for password hashing
- Jest + Supertest for testing

**Frontend**
- React 18 (Vite)
- React Router
- Tailwind CSS
- Axios (with interceptors for auth)
- FontAwesome icons

**Dev Tools**
- Nodemon
- ESLint
- Prettier

---

## Features

**Authentication**
- Sign up with email, username, and password (bcrypt hashed)
- Login issues a short-lived JWT access token + httpOnly refresh cookie
- Automatic token refresh via axios interceptors on the frontend
- Protected API routes verify the access token on every request

**Workouts**
- Create a workout with a custom name and multiple exercises
- Choose exercises from a preloaded exercise library (seeded on server startup)
- Each exercise records reps, sets, weight, time, distance, and target muscles
- Workouts are linked to the authenticated user in MongoDB

**Testing**
- Integration tests for signup, login, and user routes using Jest + Supertest
- Runs against a separate test database (`MONGO_TEST_URL`)

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local install or a free MongoDB Atlas cluster)

### 1. Clone the repo
```bash
git clone https://github.com/nicoairoldi/motion-mastery.git
cd motion-mastery
```

### 2. Set up the backend
```bash
cd node
npm install
cp .env.example .env
```

Fill in your `.env`:
- `MONGO_URL` — your MongoDB connection string
- `MONGO_TEST_URL` — a separate DB for tests (can be same cluster, different DB name)
- `SALT_ROUNDS` — bcrypt cost (e.g. `10`)
- `jwtSecret` — any random string
- `refreshSecret` — a different random string
- `SERVER_PORT` — defaults to `3001`

Start the server:
```bash
npm run dev
```

### 3. Set up the frontend
In a new terminal:
```bash
cd vite-project
npm install
npm run dev
```

The app runs at `http://localhost:3000` and talks to the API at `http://localhost:3001`.

### 4. Run tests
```bash
cd node
npm test
```

---

## API Overview

All protected routes require an `Authorization: Bearer <accessToken>` header.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/login/signup` | Public | Create a new account |
| POST | `/login/login` | Public | Log in, returns access token + sets refresh cookie |
| GET | `/auth` | Refresh cookie | Issue a new access token from the refresh cookie |
| GET | `/user/myInfo` | Bearer token | Return the logged-in user's profile + workout count |
| POST | `/user/createworkout` | Bearer token | Create a new workout with exercises |

---

## Project Structure

```
motion-mastery/
├── node/                      # Express + MongoDB backend
│   ├── auth/                  # Refresh token controller + routes
│   ├── config/                # Config (JWT secrets, etc.)
│   ├── login/                 # Signup + login controller and routes
│   ├── preloadMotions/        # Exercise library seed data + schema
│   ├── tests/                 # Jest + Supertest integration tests
│   ├── user/                  # User schema, workouts, motions, weights
│   ├── util/                  # JWT validation middleware, helpers
│   ├── server.js              # Express entry point
│   └── .env.example           # Required env vars (copy to .env)
│
└── vite-project/              # React + Vite frontend
    └── src/
        ├── api/               # Axios instance
        ├── components/        # Login, signup, workouts, myInfo, goals
        ├── context/           # Auth provider (React Context)
        ├── hooks/             # useAuth, useRefreshToken, useAxiosPrivate
        ├── navBar/            # Nav bar
        └── App.jsx            # Routes + RequireAuth
```

---

## What I Learned

- **JWT authentication and route protection.** Learned how to issue short-lived access tokens (kept in memory) alongside longer-lived refresh tokens (stored in an httpOnly cookie). Both the frontend and backend needed to enforce protection the frontend wraps private pages in a `RequireAuth` component, and the backend runs a `ValidateToken` middleware before any protected route handler.

- **Frontend/backend communication.** Understanding how React state, API calls, and the backend responses fit together was one of the biggest jumps. I set up an axios instance with interceptors so expired tokens automatically trigger a refresh request behind the scenes the user never sees the failure.

- **Defensive API design.** Learned to validate incoming request bodies (checking for required fields like email and password before touching the database) and to return meaningful HTTP status codes: `201` for created accounts, `401` for bad credentials, `403` for duplicate emails, `500` for unexpected server errors. Sending the right error is as important as sending the right data.

- **Building the frontend from scratch with Vite + React Router.** Set up routing, protected layouts, global auth state with React Context, and reusable hooks (`useAuth`, `useRefreshToken`, `useAxiosPrivate`) to keep auth logic out of individual components.

---

## Known Limitations

This is a learning project, not a finished product. Known gaps:

- **Placeholder UI data.** The My Info page displays hardcoded values for login streak (10 days), total logins (150), and weight change (5 lbs). These aren't wired to real backend data yet.
- **Incomplete pages.** The Home page is a stub, and the Stats page (intended for a workout heatmap) is an empty component.
- **Goals page is partially wired.** The UI reads user info correctly, but the update endpoints it calls (`/user/updateWeight`, `/user/updateWeeklyGoal`) don't exist on the backend yet.
- **Seed data reloads on every restart.** The exercise library gets reinserted into MongoDB every time the server starts, which duplicates entries. Should check for existing data first.
- **No frontend tests.** Backend has integration coverage; the React frontend has none.
- **Verbose logging.** The backend has many `console.log` calls left over from development that should be replaced with a proper logger before any real deployment.

---

## What I'd Do Differently

Now that I've worked more with full-stack apps, here's how I'd approach a v2:

- **TypeScript on both frontend and backend.** Would catch entire classes of bugs (typos, missing request body fields) at compile time instead of runtime.
- **Cleaner folder naming.** Rename `node/` → `backend/` and `vite-project/` → `frontend/`. Small change, big readability win.
- **Centralized error handling.** Right now each controller manually sends error responses. A shared error-handling middleware would keep controllers focused on business logic.
- **Environment-aware seeding.** The exercise library should only seed if the collection is empty, and probably only in development.
- **Proper logging (Winston or Pino).** Replace scattered `console.log` calls with a real logger that supports log levels and structured output.
- **Frontend testing (Vitest + React Testing Library).** Cover the auth flow, protected route guards, and form submissions.

---

## Author

**Nico Airoldi**
- GitHub: [@nicoairoldi](https://github.com/nicoairoldi)
