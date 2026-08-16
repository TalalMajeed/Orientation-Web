# NUST Orientation '26 — _Ab Kahani Tumhari Hai_

The official web hub for NUST's incoming batch. It has two halves:

1. **The public website** — an immersive, editorial landing experience (video
   hero, schedule, campus map, societies, contact) styled after modern
   award-winning agency sites.
2. **The admin system** — the liaison/house allocation tool, HR invite links,
   and a newsletter, all backed by MongoDB.

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **three.js / @react-three/fiber / @react-three/drei** — WebGL starfield + clouds on the intro gate
- **Leaflet / react-leaflet** — interactive campus map (CARTO Voyager tiles)
- **Lenis** — smooth scrolling · **GSAP** — hero animation
- **MongoDB** (`lib/mongodb.ts`) · HMAC-cookie auth (`services/auth/session.ts`)

---

## Project structure

```
app/
  page.tsx               # Landing (website)
  schedule/  map/  contact/    # Website pages
  liaison/               # OG houses & batch allocation (admin)
  hr/  login/            # HR invite links + shared staff auth
  api/                   # Backend routes
components/
  website/               # <- the public website UI
    dw/                  # Landing sections (hero, schedule, map, contact, footer)
    site/                # EntryExperience (intro gate), MapView, ThemeToggle, WebsiteChrome
    hero/Scene.tsx       # WebGL stars + clouds
  liaison/  hr/          # Admin panel UI
services/                # auth, liaison, hr, newsletter, security
docs/site-structure.md   # Full page-by-page map: public site + every admin panel
```

For a complete route-by-route reference (every page, every admin panel, who
can log into what), see [`docs/site-structure.md`](docs/site-structure.md).

---

## Getting started

**Prerequisites:** Node 20+, and MongoDB credentials for the backend features
(the public website runs without them).

```bash
npm install
```

### Environment

Secrets are pulled through the `esecrets` pipeline (`secrets.js`, needs
`SECRETS_KEY`). If you have it:

```bash
npm run dev          # esecrets injects env, then starts Next
```

To run **just the public website** without the secrets pipeline:

```bash
npx next dev         # website pages don't need env
```

Backend features need these (set via the pipeline or a local `.env`):

| Variable | Used by |
|---|---|
| `MONGO_DB_URI` | database (liaison, HR links, newsletter) |
| `HR_USERNAME`, `HR_PASSWORD`, `HR_SESSION_SECRET` | admin auth |
| `LIAISON_USERNAME`, `LIAISON_PASSWORD` | liaison panel auth (OG team) |
| `SECRETS_KEY` | `esecrets` pipeline |

### Common scripts

```bash
npm run build        # production build (needs backend env)
npm start            # serve the build
npm run lint
npm test             # jest (unit + liaison API against a real mongod)
npm run e2e          # full HTTP walkthrough, real server (needs npm run build first)
```

---

## The website

**Pages:** `/` (landing), `/schedule`, `/map`, `/contact`, `/societies`.

**The intro gate** (`components/website/site/EntryExperience.tsx`) shows a WebGL
night sky (`hero/Scene.tsx`) with the "چلو شروع کریں" button; entering reveals
the video hero and starts its audio.

**Design system**

- Fonts: **ITC Garamond** (display headings), **IBM Plex Mono** & **Poppins**
  (body/labels), **Rakkas** (Urdu). Loaded in `app/layout.tsx` + `globals.css`.
- **Light/dark theme** via semantic tokens (`--color-surface` / `--color-fg`)
  that flip on `[data-theme="dark"]`; brand accents (ember, sky, navy) stay
  fixed. Default is light; the toggle is bottom-right.
- Site-wide **film grain** and a subtle **decorative ellipse** behind headings.
- Website-only chrome (smooth scroll, theme toggle, grain) lives in
  `WebsiteChrome` so the admin pages are unaffected.

---

## Admin panels

Every staff panel — liaison, HR links — is mapped route by route in
[`docs/site-structure.md`](docs/site-structure.md). See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines.

**Liaison API.** The OG house/allocation workspace is persisted server-side and
reached through `/api/v1/liaison/*` (`state`, `config`, `houses`,
`houses/[id]`, `houses/reseed`, `students`, `allocation`). Every endpoint
requires a `liaison` or `admin` session and answers with the whole workspace,
so the client replaces its state rather than merging.

**Request limits & headers.** `proxy.ts` rate-limits `/api/*` and `/invite/*`
per IP (`services/security/rateLimit.ts`) and sets CSP/HSTS/frame/referrer
headers on every response (`services/security/headers.ts`).

---

## Credits

UI designed by **Faseeh** · [linkedin.com/in/faseeh06](https://www.linkedin.com/in/faseeh06)
