# Brownie Book

Offline-first mobile app for one brownie supplier: suppliers, sales, payments, expenses.
React + Vite + TypeScript + Tailwind + Dexie (IndexedDB) + PWA.

## Run

```bash
npm install
npm run icons        # optional: icons are already in /public
npm run test:calc    # checks the money maths with the ABC Cafe example
npm run dev          # http://localhost:5173
npm run build        # tsc + production build into /dist
npm run preview      # serve the production build
```

## Install on Android (works offline afterwards)

The service worker only registers on HTTPS (or localhost). Host the `dist` folder once
(Netlify, Vercel, Cloudflare Pages, GitHub Pages at a domain root, etc.), open it in Chrome
on the phone, then use **Install app** / **Add to Home screen**. After that it opens and runs
with no internet.

Payments are recorded per supplier (Supplier page → Receive payment) and applied to the oldest unpaid sales first. Set pieces-per-box in the cog → Settings. All data stays in the phone's IndexedDB; use the cog on the Dashboard
for Export / Import backup.
