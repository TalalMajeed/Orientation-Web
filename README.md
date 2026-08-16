# NUST Orientation '26 — _Ab Kahani Tumhari Hai_

The official web hub for NUST's incoming batch. Two halves in one Next.js app:

1. **The public website** — an editorial landing experience (entry gate, video
   hero, schedule, campus map, contact, newsletter).
2. **The staff panels** — the liaison house/allocation workspace and the HR
   invite-link manager, both backed by MongoDB.

---

## Tech stack

| Area | What's used |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** |
| Styling | **Tailwind CSS v4** with semantic theme tokens in `app/globals.css` |
| 3D / motion | **three.js** + **@react-three/fiber** + **drei** (entry-gate night sky) · **GSAP** (floating logo) |
| Map | **Leaflet** + **react-leaflet**, CARTO Voyager tiles |
| Data | **MongoDB** (`lib/mongo.ts`) · **xlsx** for merit-list upload/export |
| Auth | HMAC-signed session cookie (`services/auth/session.ts`) |

---

## Project structure

```
app/                       Routes only — pages, layouts, API handlers
  page.tsx                 Landing
  schedule/ map/ contact/ societies/ privacy/ terms/
  admin/ login/            Portal directory + shared staff sign-in
  hr/ liaison/             Staff panels
  api/v1/                  auth, liaison, hr, newsletter endpoints
  invite/[id]/             Short-link redirect

components/
  site/                    Site-wide UI: chrome, nav, theme, consent, gate, sky, logo, ellipse
  section/                 Landing sections: hero, welcome, schedule, events, contact, form, legal, footer
  campus/                  Campus map: landmarks (data), view (Leaflet), explorer (filters + map)
  liaison/                 Liaison workspace: overview, houses, students, allocation, store, sheet, labels
  hr/                      Invite-link manager

services/                  Server-side logic (never imported by client code)
  auth/                    session signing + role guard
  liaison/                 db, allocate, seed, validate, respond, types
  hr/  newsletter/         short links, newsletter subscribers
  security/                headers (CSP etc.), limit (rate limiter)

lib/                       Shared helpers: mongo, request, seo
proxy.ts                   Middleware: rate limits → route guards → security headers
docs/site-structure.md     Route-by-route reference
```

**Conventions:** one lowercase word per filename (`hero.tsx`, `limit.ts`),
folders named the same way, imports through the `@/` alias, and no comments —
names carry the meaning. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Getting started

**Prerequisites:** Node 20+. MongoDB credentials are only needed for the staff
panels and the newsletter; the public website runs without them.

```bash
npm install
npm run dev          # esecrets injects env, then starts Next
npx next dev         # website-only: no env needed
```

### Environment

| Variable | Used by |
|---|---|
| `MONGO_DB_URI` | database (liaison workspace, HR links, newsletter) |
| `HR_USERNAME`, `HR_PASSWORD` | admin login |
| `HR_SESSION_SECRET` | session cookie signing |
| `LIAISON_USERNAME`, `LIAISON_PASSWORD` | liaison login (OG team) |
| `SECRETS_KEY` | `esecrets` / `npm run secrets` pipeline |

Secrets come from the `esecrets` pipeline. `npm run secrets` fetches them into
`.env` and `secrets.json` directly, if you prefer a local file.

### Scripts

```bash
npm run dev          # dev server with env injected
npm run build        # production build (needs backend env)
npm start            # serve the build
npm run lint         # eslint
npm test             # jest unit tests
npm run e2e          # full HTTP walkthrough of the liaison API (run npm run build first)
npm run secrets      # write .env from the secrets service
```

---

## The website

**Pages:** `/` · `/schedule` · `/map` · `/contact` · `/societies` · `/privacy` · `/terms`

- **Entry gate** (`components/site/gate.tsx`) — a WebGL night sky
  (`site/sky.tsx`) behind the "چلو شروع کریں" button. Dismissing it starts the
  hero video from frame one, unmuted, and fires a `site:entered` event that the
  cookie banner waits for.
- **Hero** (`section/hero.tsx`) — full-viewport video with its own top bar; the
  volume fades to 50% as the section scrolls away.
- **Campus map** (`components/campus/`) — Leaflet map of H-12, filterable by
  category, bounded to campus. Loaded client-side only.
- **Theme** — light/dark via semantic tokens (`--color-surface`, `--color-fg`,
  their `inverse-` pair) that flip on `[data-theme="dark"]`; brand colours
  (ink, navy, blue, sky, ember) stay fixed. Light is the default; the toggle
  sits bottom-right. A pre-paint inline script in `app/layout.tsx` applies the
  stored theme so the page never flashes.
- **Fonts** — ITC Garamond (`font-serif`, display headings), IBM Plex Mono
  (`font-mono`, labels), Niveau Grotesk (`font-italic`), Rakkas (`font-urdu`).
- Site-wide film grain and the slow-spinning `.orbit` ellipse come from
  `components/site/chrome.tsx` and `app/globals.css`.

---

## Staff panels

Every route is mapped in [`docs/site-structure.md`](docs/site-structure.md).

- **`/admin`** — portal directory; each entry links to the shared staff login.
- **`/liaison`** (liaison or admin) — OG houses, merit-list upload, and
  one-click allocation across houses and OG groups, balanced by gender and
  school. State is a single MongoDB document; every `/api/v1/liaison/*`
  endpoint answers with the whole workspace, so the client replaces its state
  instead of merging.
- **`/hr`** (admin) — create, edit and delete short invite links served from
  `/invite/<code>`.

**Security.** `proxy.ts` runs on every request: per-IP fixed-window rate limits
on `/api/*` and `/invite/*`, redirects for guarded prefixes, and CSP/HSTS/frame
/referrer headers on the way out. The redirect is convenience only — each route
handler re-checks the session with `requireRole`, and all request bodies are
re-validated server-side.

---

## Credits

UI designed by **Faseeh** · [linkedin.com/in/faseeh06](https://www.linkedin.com/in/faseeh06)
