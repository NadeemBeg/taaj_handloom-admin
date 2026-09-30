# TAAJ Handloom — Admin

Internal admin dashboard for TAAJ Handloom (products, categories, orders, coupons,
banners, reports). React + Vite + TypeScript SPA that talks to the backend API.

## Tech
- React 18, Vite, TypeScript, React Router (client-side routing)
- Bundles the shared `@taaj/shared` package locally (see [Shared package](#shared-package))

## Local development
```bash
npm install
cp .env.example .env       # set VITE_API_URL to your API, see below
npm run dev                # http://localhost:3002
```
Scripts: `npm run build` (→ `dist/`), `npm run preview`, `npm run lint`.

## Environment variables (build-time)
Vite inlines `VITE_*` vars **at build time**, so set them before/at build.

| Var | Notes |
|-----|-------|
| `VITE_API_URL` | Backend base URL **including** `/api/v1`, e.g. `https://taaj-handloom-api.onrender.com/api/v1` |
| `VITE_BRAND_NAME` | e.g. `TAAJ Handloom Admin` |

## Deploy — Vercel (free)
This repo ships a `vercel.json` (build command, output dir, and SPA rewrite to `/index.html`).

1. Vercel → **New Project** → import this repo. It auto-detects Vite and reads `vercel.json`:
   - Build: `npm install && npm run build`
   - Output: `dist`
   - Rewrite: all routes → `/index.html` (required for client-side routing)
2. Add env vars (**Project → Settings → Environment Variables**):
   `VITE_API_URL` (the deployed backend + `/api/v1`), `VITE_BRAND_NAME`.
3. Deploy. Then, in the **backend** (Render), add this site's URL to `ADMIN_URL` so CORS allows it.

> Because `VITE_API_URL` is baked in at build time, changing the API URL means triggering a
> new Vercel build (redeploy), not just an env edit.

## Shared package
`@taaj/shared` is vendored into `./shared` and wired as `"@taaj/shared": "file:./shared"`.
The build compiles it first via `npm run build:shared`. Keep it in sync with the backend and
frontend copies if you change shared logic.
