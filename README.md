# Budget Tracker (가계부)

A personal budget tracking PWA built with React, Firebase, and Vite.

## Features

- Track income and expenses by category
- Monthly spending overview with charts (Recharts)
- Light/Dark mode
- Installable as a PWA (Progressive Web App)
- Admin panel for managing users
- Real-time sync via Firebase Firestore

## Tech Stack

- **Frontend**: React 19, Framer Motion, Lucide React
- **Charts**: Recharts
- **Backend**: Firebase Firestore
- **Build**: Vite
- **Deploy**: Firebase Hosting

## Getting Started

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run deploy
```

This runs `vite build` then deploys to Firebase Hosting via the Firebase CLI.

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config (optional — defaults to the shared project config in `src/firebase.js`).
