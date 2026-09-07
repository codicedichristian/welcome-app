# Welcome App 🙏

A production-grade **Progressive Web App** built for a faith community — handling event RSVPs, announcements, real-time updates, and multilingual support for 50+ active members.

---

## Screenshots

<img width="218" height="470" alt="Screenshot 2026-09-07 at 16 41 46" src="https://github.com/user-attachments/assets/82d3b126-21d4-481c-bdff-bffb86e46835" />

<img width="217" height="442" alt="Screenshot 2026-09-07 at 16 45 23" src="https://github.com/user-attachments/assets/0bedcc21-2af8-4883-aa07-b4d9406c9360" />

<img width="217" height="477" alt="Screenshot 2026-09-07 at 16 51 44" src="https://github.com/user-attachments/assets/98596ca0-1a99-4c37-bf34-92a428d7c792" />

<img width="1429" height="528" alt="Screenshot 2026-09-07 at 16 52 34" src="https://github.com/user-attachments/assets/393ad1e5-f6f2-43e0-a954-e1d51726c622" />

---

## Features

- 🔐 **Authentication** — Supabase Auth with role-based access control (admin / member)
- 📅 **Event RSVP** — members can register for events; admins see attendance in real time
- 🗺️ **Interactive Maps** — venue locations via Leaflet / React-Leaflet
- 🔔 **Push Notifications** — service worker push + background sync (iOS & Android)
- 🌍 **Multilingual UI** — Italian, Spanish, English via i18next
- 📴 **Offline-first** — custom Workbox caching strategy; works without connection
- 👤 **Admin Panel** — role-based dashboard for managing members and events
- ⚡ **Real-time updates** — Supabase Realtime subscriptions for live data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TypeScript · Vite 8 · Tailwind CSS v4 |
| Backend / DB | Supabase (PostgreSQL · RLS · Auth · Realtime) |
| Routing | React Router v6 |
| Maps | Leaflet · React-Leaflet |
| PWA | Workbox · Service Worker · Web Push |
| i18n | i18next |
| Testing | Vitest · React Testing Library |
| CI/CD | Vercel (dev + prod environments) · Husky pre-commit hooks |

---

## Architecture

```
src/
├── components/        # Reusable UI components
├── pages/             # Route-level page components
├── hooks/             # Custom React hooks
├── lib/               # Supabase client, helpers
├── locales/           # i18n translation files (it / es / en)
└── service-worker/    # Workbox PWA configuration
```

PostgreSQL schema uses **Row Level Security (RLS)** policies to enforce access control at the database level — admins see all records, members see only their own data.

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/codicedichristian/welcome-app.git
cd welcome-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and anon key

# Run in development
npm run dev

# Run tests
npm run test
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Deployment

The app is deployed on **Vercel** with two separate environments:

- `main` branch → production (`welcome-app-smoky.vercel.app`)
- `dev` branch → staging (preview URL)

Weekly production releases driven by real user feedback.

---

## Built by

[Christian Scorza](https://linkedin.com/in/christianscorza) — sole architect and developer.  
Full system design, database schema, RLS policies, CI/CD pipeline, and all production releases.
