# NUST Orientation '26 — _Ab Kahani Tumhari Hai_

The official web hub for NUST's incoming batch. It has two halves:

1. **The public website** — an immersive, editorial landing experience (video
   hero, schedule, campus map, event tickets, contact) styled after modern
   award-winning agency sites.
2. **The ticketing & admin system** — event e-ticketing (issue → email QR →
   scan at the gate), a support-ticket helpdesk, HR link tools, and a
   newsletter, all backed by MongoDB and Microsoft Graph mail.

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **three.js / @react-three/fiber / @react-three/drei** — WebGL starfield + clouds on the intro gate
- **Leaflet / react-leaflet** — interactive campus map (CARTO Voyager tiles)
- **Lenis** — smooth scrolling · **GSAP** — hero animation
- **MongoDB** (`lib/mongodb.ts`) · **Microsoft Graph** mail (`services/email/graph.ts`) · HMAC-cookie auth (`services/auth/session.ts`)

---

## Project structure

```
app/
  page.tsx               # Landing (website)
  schedule/  map/  contact/    # Website pages
  tickets/               # Support-ticket helpdesk (admin)
  event-tickets/         # Event e-ticketing (issue / list)
  login/  scan/          # Auth + QR gate scanning
  api/                   # Backend routes
components/
  website/               # <- the public website UI
    dw/                  # Landing sections (hero, schedule, map, tickets, contact, footer)
    site/                # EntryExperience (intro gate), MapView, ThemeToggle, WebsiteChrome
    hero/Scene.tsx       # WebGL stars + clouds
  tickets/               # Ticketing/admin UI
services/                # tickets, auth, email, newsletter, hr
docs/event-ticketing.md  # Ticketing system design brief
docs/site-structure.md   # Full page-by-page map: public site + every admin panel
```

For a complete route-by-route reference (every page, every admin panel, who
can log into what), see [`docs/site-structure.md`](docs/site-structure.md).

---

## Getting started

**Prerequisites:** Node 20+, and MongoDB + Microsoft Graph credentials for the
backend features (the public website runs without them).

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
| `MONGO_DB_URI` | database (tickets, newsletter) |
| `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`, `MS_GRAPH_SENDER` | ticket emails (MS Graph) |
| `HR_USERNAME`, `HR_PASSWORD`, `HR_SESSION_SECRET` | admin auth |
| `SECRETS_KEY` | `esecrets` pipeline |

### Common scripts

```bash
npm run build        # production build (needs backend env)
npm start            # serve the build
npm run lint
npm test             # jest
npm run e2e          # end-to-end checks
```

---

## The website

**Pages:** `/` (landing), `/schedule`, `/map`, `/contact`. The nav's "Tickets"
links into the event-ticketing system (`/event-tickets`).

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
  `WebsiteChrome` so the admin/ticketing pages are unaffected.

---

## Ticketing & admin

Event e-ticketing, scanning, and the helpdesk are documented in
[`docs/event-ticketing.md`](docs/event-ticketing.md). See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines.

---

## Credits

UI designed by **Faseeh** · [linkedin.com/in/faseeh06](https://www.linkedin.com/in/faseeh06)
