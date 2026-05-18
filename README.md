# GymPro X – Premium Gym Management System

GymPro X is a full‑stack gym management system built with Angular 17+ (standalone APIs), Node.js, Express, and MongoDB.  
It provides a modern SaaS‑style UI to manage members, trainers, payments, attendance, and dashboards.

---

## Features

- **Authentication**
  - JWT‑based login for Admin and Member
  - Role‑based routing (separate Admin and User areas)

- **Admin Dashboard**
  - Key stats: total members, active members, monthly revenue, pending fees, trainers, today’s attendance
  - Revenue bar chart for last 6 months
  - Recent members list with status and fee badges

- **Members Management**
  - Add / edit / delete members
  - Auto member ID (M001, M002, …) via seed data
  - Assign plan and trainer
  - Track status (Active / Expired / Suspended) and fee status (Paid / Pending / Overdue)
  - Search and filter by name, email, phone, status, and fee status

- **Trainers Management**
  - Add / edit trainers
  - Deactivate trainer (treated as remove)
  - Store specialty, shift, experience, and contact details

- **Payments**
  - Record new payments (member, plan, amount, method, status, date)
  - Auto‑fill amount from plan price
  - View all transactions with invoice number, status chips, and totals (collected vs pending)

- **Attendance**
  - Seeded weekly attendance data
  - Simple stats and table (can be extended to live check‑in)

- **UI / UX**
  - Dark, glassmorphism‑style layout
  - Separate layouts for Admin and Member
  - Responsive design built with pure SCSS and Angular templates (no heavy UI library)

---

## Tech Stack

- **Frontend**
  - Angular 17+ with Standalone Components and `ApplicationConfig`
  - TypeScript, RxJS, Angular Router, HttpClient
  - SCSS for styling

- **Backend**
  - Node.js, Express
  - MongoDB with Mongoose
  - JWT authentication (`Authorization: Bearer <token>`)

---

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB running locally on `mongodb://localhost:27017`
- npm or yarn

---

## Project Structure

```text
gymsystem/
  backend/
    models/
      User.model.js
      Member.model.js
      Trainer.model.js
      Plan.model.js
      Payment.model.js
      Attendance.model.js
    routes/
      auth.routes.js
      member.routes.js
      trainer.routes.js
      payment.routes.js
      attendance.routes.js
      dashboard.routes.js
    middleware/
      auth.middleware.js
    server.js
    seed.js
    dropIndexes.js
    .env
  frontend/
    src/
      main.ts
      index.html
      styles.scss
      app/
        app.component.ts
        app.config.ts
        app.routes.ts
        services/
          auth.service.ts
          api.service.ts
        core/
          guards/auth.guard.ts
          interceptors/auth.interceptor.ts
        components/
          auth/login/
          admin/layout/
          admin/dashboard/
          admin/members/
          admin/trainers/
          admin/payments/
          admin/attendance/
          user/layout/
          user/dashboard/
```

---

## Environment Configuration

### Backend `.env`

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/gymsystem
JWT_SECRET=gymsecretkey2026
JWT_EXPIRES_IN=7d
```

### Frontend `environment.ts`

In `frontend/src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

---

## Setup & Installation

### 1. Install dependencies

**Backend:**

```bash
cd backend
npm install
```

**Frontend:**

```bash
cd frontend
npm install
```

---

## Database Seeding

Run seeding once to create demo data (admin, member, plans, trainers, members, payments, attendance).

From `backend` folder:

```bash
node dropIndexes.js   # drops old unique indexes on memberId and invoiceNo (idempotent)
node seed.js          # inserts all demo data
```

If `seed.js` finishes successfully you should see:

```text
✅ Seed complete!
Admin  → admin@gym.com  / admin123
Member → user@gym.com   / user123
```

---

## Running the App

### Backend API server

From `backend`:

```bash
npm run dev
```

Server will run at:

- `http://localhost:5000`
- API base URL: `http://localhost:5000/api`

### Frontend Angular app

From `frontend`:

```bash
ng serve --open
```

Angular dev server runs at:

- `http://localhost:4200`

---

## Login Credentials

After seeding, use:

- **Admin**
  - Email: `admin@gym.com`
  - Password: `admin123`

- **Member**
  - Email: `user@gym.com`
  - Password: `user123`

Admin dashboard is available at `/admin/dashboard` after login.  
Member portal is available at `/user/dashboard` after member login.

---

## Main API Endpoints (Backend)

Base URL: `http://localhost:5000/api`

- `POST /auth/login` – login, returns `{ success, token, user }`
- `GET /auth/me` – get current user (requires `Authorization` header)

- `GET /dashboard/stats` – admin dashboard statistics

- `GET /members` – list members (query: `search`, `status`, `feeStatus`, `page`, `limit`)
- `GET /members/:id`
- `POST /members` – create member (admin)
- `PUT /members/:id` – update member (admin)
- `DELETE /members/:id` – delete member (admin)

- `GET /trainers`
- `POST /trainers` – add trainer (admin)
- `PUT /trainers/:id` – update trainer (admin)
- `DELETE /trainers/:id` – delete / deactivate trainer (admin)

- `GET /payments`
- `GET /payments/member/:id`
- `POST /payments` – record payment (admin)
- `PUT /payments/:id` – update payment (admin)
- `DELETE /payments/:id` – delete payment (admin)

- `GET /attendance`
- `POST /attendance/checkin`
- `GET /attendance/stats/weekly`

All protected routes require `Authorization: Bearer <JWT>` header.

---

## Frontend Highlights

- Angular standalone routing via `app.routes.ts` with lazy `loadComponent`.
- Functional `authGuard` and `authInterceptor`.
- Admin layout with sidebar, top bar, and router outlet.
- Fully wired screens:
  - Login
  - Dashboard (stats + mini charts)
  - Members (form + table + filters + CRUD)
  - Trainers (cards + add/edit/remove)
  - Payments (form + transactions table)
  - Attendance (seeded data visuals)
  - User layout + simple member dashboard

---

## How to Extend

Some ideas you can implement next:

- Add **plan management** screens (CRUD) on the admin side.
- Implement live **attendance check‑in** using a simple member search and check‑in button.
- Export reports (CSV or PDF) for payments and attendance.
- Replace emojis with proper icon set (e.g., Angular Material Icons or Lucide).

---

## Troubleshooting

- If `node seed.js` throws **duplicate key errors** on `memberId` or `invoiceNo`, run:

  ```bash
  node dropIndexes.js
  node seed.js
  ```

- If login returns `401`:
  - Ensure backend is running on port 5000.
  - Ensure `environment.apiUrl` points to `http://localhost:5000/api`.
  - Use seeded credentials `admin@gym.com` / `admin123`.

---

## License

This project is for learning and demo purposes.  
You can modify and reuse it for your personal or academic projects.
