# SSC CHSL Maths Study Planner

A dynamic, responsive, and production-ready web application designed to automatically generate, adapt, and manage a realistic Mathematics study schedule for SSC CHSL preparation based on available lectures, daily study time, revision days, and actual student progress.

---

## 🌟 Core Highlights & Architectural Principles

1. **Non-Hardcoded Dynamic Scheduling Engine**:
   - Intelligently combines lectures (1.5h each) with practice/PYQs (30m) to strictly fit the 3.5h daily target.
   - Calculates available days, blackout exam periods (e.g. 4 Oct → 27 Oct break), and dynamically starts from 28 October.
   - Enforces 2 dedicated revision days per week (Thursday & Sunday by default) that never advance lecture counts.
   - Intelligently generates formula retention drills and SSC CHSL PYQs for completed and difficult chapters.

2. **Feasibility Analysis & Capacity Warnings**:
   - Automatically computes required daily study hours. If the schedule is unachievable before the target date without exceeding daily study hours, it displays an actionable alert with one-click adjustments (Increase hours, reduce revision days, or extend target date).

3. **Intelligent Rescheduling**:
   - **Missed Work**: Rebalances uncompleted lectures smoothly across remaining available study days without overloading.
   - **Ahead of Schedule**: Prompts the user with 🎉 *Ahead of Schedule* banner and offers options to `[Keep Current Schedule]` or `[Optimize Schedule]` (condensing days or reducing future daily hours).

4. **Modular Service Separation**:
   - `/server/services/scheduler/`
     - `schedulerEngine.js`: Master generation of day-by-day tasks
     - `workloadCalculator.js`: Calendar, buffer days, capacity, and feasibility
     - `revisionPlanner.js`: Priority scoring for formula consolidation and PYQs
     - `rescheduler.js`: Rebalancing on missed/ahead events
     - `progressCalculator.js`: Aggregated analytics, streaks, and subject breakdowns

5. **Initial Syllabus Out-of-the-Box**:
   - Geometry: 24 lectures (Difficult)
   - Trigonometry: 12 lectures (Difficult)
   - Data Interpretation: 3 lectures (Easy)
   - Mensuration 2D: 13 lectures (Medium)
   - Statistics: 3 lectures (Easy)
   - Percentage: 14 lectures (Medium)
   - Compound & Simple Interest: 12 lectures (Medium)
   - Profit & Loss + Discount: 12 lectures (Medium)
   - Average: 6 lectures (Easy)
   - **Total: 99 lectures (~148.5 hours)**

---

## 🚀 Running the Application

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22.17.0)
- **MongoDB**: Running locally on `mongodb://127.0.0.1:27017`

### 2. Quick Start
From the project root directory:

```bash
# Start both Backend (port 5000) and Frontend Vite dev server (port 3001):
npm run dev
```

Or run standalone production server (serves the built React SPA directly from port 5000):
```bash
npm start
```

- **Frontend Application**: [http://localhost:3001](http://localhost:3001) (or [http://localhost:5000](http://localhost:5000))
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📱 Application Views & Pages

- **Dashboard** (`/`): Good Morning greeting, 4 key KPI cards (Today's Goal 3.5h, Completed, Remaining, Current Streak), Today's schedule preview, Overall Progress bar, Topic progress cards, and Recharts weekly activity bar chart.
- **Today's Plan** (`/today`): Full date-based plan with checkboxes, duration badges, custom task addition, and section 8 Quick Log dropdown.
- **Schedule Timeline** (`/schedule`): Full roadmap breakdown with filters (All, Lectures, Revision, Pending) and search.
- **Calendar View** (`/calendar`): Monthly interactive grid with color-coded status badges:
  - 🟢 Completed
  - 🟡 Partially completed
  - 🔴 Missed
  - 🔵 Revision day
  - ⚪ Future study day
- **Topics & Syllabus** (`/topics`): Chapter progress cards, difficulty rating pills, detailed drawer with lectures breakdown, and ability to add/edit/delete topics.
- **Progress & Analytics** (`/progress`): Deep performance analytics, weekly target vs completed hours, and study streak tracking.
- **Revision Hub** (`/revision`): Retention engine displaying priority-scored chapters and one-click formula / PYQ drill logging.
- **Settings** (`/settings`): Customization of daily study hours, lecture duration, revision days, start date, target exam date, blackout periods, and reset to defaults.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React, Recharts, React Router v6, Date-fns
- **Backend**: Node.js, Express.js, Mongoose, JWT Authentication, Bcryptjs
- **Database**: MongoDB (Atlas for Cloud / Local for dev)
- **Deployment Target**: Vercel (Serverless Functions + Global Edge CDN)

---

## ⚡ Deploying on Vercel

This repository is configured for full-stack deployment on [Vercel](https://vercel.com) out of the box using Serverless Functions for Express API and Vercel CDN for the Vite React frontend.

### 1. Prerequisites
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or any cloud MongoDB instance).
- Obtain your MongoDB connection string (e.g. `mongodb+srv://<username>:<password>@cluster0.mongodb.net/ssc_chsl_planner?retryWrites=true&w=majority`).

### 2. Deploy via Vercel Dashboard (Recommended)
1. Push this project to GitHub / GitLab / Bitbucket.
2. In Vercel, click **"Add New..."** → **"Project"** and import the repository.
3. Configure the Project Settings (detected automatically from `vercel.json`):
   - **Framework Preset**: Vite (or Other)
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/dist`
4. Add the following **Environment Variables** in Vercel:
   | Variable | Value | Description |
   |---|---|---|
   | `MONGODB_URI` | `mongodb+srv://...` | **Required**: Your MongoDB Atlas connection URI |
   | `JWT_SECRET` | `<random-32-char-string>` | Secret key for JWT auth tokens |
   | `NODE_ENV` | `production` | Production environment flag |
5. Click **"Deploy"**.

### 3. Deploy via Vercel CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy directly
vercel

# For production deployment
vercel --prod
```
Ensure you set the `MONGODB_URI` environment variable in your Vercel project settings.
