# Site structure — NUST Orientation '26

A page-by-page map of every route in the app: the public marketing site, and
the three staff/admin panels behind it.

---

## 1. Public website

The marketing site. No login required for any of these.

| Route | Purpose |
|---|---|
| `/` | Landing page. Entry gate (WebGL intro) → hero video → Welcome to NUST / Orientation → Schedule → Campus Map → Events (coming soon) → Contact form → newsletter/footer. |
| `/schedule` | Full day-by-day orientation schedule (Day 01–03 tabs). Currently marked "coming soon" — no times are finalized. |
| `/map` | Interactive campus map (Leaflet + CARTO tiles), filterable by category (Gates, Mosques, Sports, Hostels, Schools, Cafes, Banks, Facilities), with zoom controls and a recenter button. |
| `/contact` | Full contact page: "Email the team" CTA, a quick Name/Email/Message form that opens a prefilled mail draft to `support@orientation.nust.edu.pk`, contact-detail cards, and social links. |
| `/about`, `/plan`, `/gallery` | Placeholder content pages (static copy, not yet built out). |
| `/privacy`, `/terms` | Legal boilerplate. |

**Shared chrome:** `WebsiteChrome` (theme toggle, film grain, smooth scroll) and `PageNav` (sticky header with logo + Schedule/Map/Contact nav) wrap every page above except the homepage, which uses `DwHero`'s own top bar instead.

---

## 2. Admin hub

`/admin` is a branded directory, not a login form — it lists every panel below with a one-line description and links straight to that panel's own sign-in.

---

## 3. Staff panels

Three separate systems, each with its own login and its own audience.

| Panel | Entry point | Who signs in | What it does |
|---|---|---|---|
| **Liaison** | `/login?next=/liaison` → `/liaison` | OG team (`LIAISON_USERNAME` / `LIAISON_PASSWORD`) | Manage the 10 OG Houses and their OGs, upload/generate a student batch, auto-divide it across houses & groups (gender + school balanced), review and export. State lives in MongoDB behind `/api/v1/liaison/*`. |
| **HR** | `/login?next=/hr` → `/hr` | Admin role | Create/manage short invite links (`/invite/<code>` → redirects to a target URL). |

### Access model

- **Real staff auth** (HR, Liaison): HMAC-signed session cookie (`services/auth/session.ts`), roles `admin` / `liaison`. `proxy.ts` redirects unauthenticated requests to `/login?next=<path>`; every route handler re-checks the session itself (the proxy redirect is convenience, not the security boundary).
- **Rate limiting**: `proxy.ts` applies a per-IP fixed-window limit to `/api/*` and `/invite/*` — 10 sign-in attempts per 15 min, 10/hour on the public newsletter POST, 60 writes and 200 reads per minute elsewhere. In-memory, so it is per instance (see `services/security/rateLimit.ts`).
- **Security headers**: `proxy.ts` sets CSP, HSTS (https only), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and the cross-origin isolation headers on every response (see `services/security/headers.ts`).

---

## 4. Design system reference

All colors are CSS custom properties in `app/globals.css` (`@theme` blocks) — change a token once, it updates everywhere:

| Token | Role |
|---|---|
| `--color-surface` / `--color-fg` | Page background / text. Flips per `data-theme` (light: near-white blue `#F2F7FF`; dark: `#0B0F18`). |
| `--color-inverse-surface` / `--color-inverse-fg` | Always the *opposite* of surface/fg — used for the permanently-inverted footer band (`DwContact`) so it contrasts regardless of site theme. |
| `--color-ember` | Shared accent (buttons, CTAs, highlights) — currently blue (`#2A5290`), drawn from the palette's own `--color-blue`. |
| `--color-sky` / `--color-navy` / `--color-blue` / `--color-blue-light` | Fixed brand blues, used directly in a few places (gender-color dots, accents). |
| `--color-cream` | Legacy name, now aliased to the same value as `--color-surface` — no separate "cream/white" color exists anymore. |

Fonts: `font-serif` (ITC Garamond, display headings), `font-mono` (IBM Plex Mono, labels/eyebrows), `font-italic` (Niveau Grotesk), `font-urdu` (Rakkas, RTL accent lines).

---

## 5. Full route table

```
Public site
  /                          Landing
  /schedule                  Schedule
  /map                       Campus map
  /contact                   Contact + quick message form
  /about  /plan  /gallery     Placeholder pages
  /privacy  /terms           Legal

Admin hub
  /admin                     Portal directory

Liaison
  /login?next=/liaison       Sign in
  /liaison/login             Alias → the shared staff login
  /liaison                   Dashboard (Overview / Houses / Students / Allocation)

API (liaison or admin session; every response carries the whole workspace)
  GET    /api/v1/liaison/state          Read the workspace
  DELETE /api/v1/liaison/state          Clear everything back to seeded houses
  PATCH  /api/v1/liaison/config         Set/clear the per-house capacity
  GET    /api/v1/liaison/houses         The 10 houses and their OGs
  PATCH  /api/v1/liaison/houses/[id]    Rename the OL ({ol}) or an OG ({ogId,name})
  POST   /api/v1/liaison/houses/reseed  Restore the seeded houses
  GET    /api/v1/liaison/students       The roster + parse log
  PUT    /api/v1/liaison/students       Replace the roster (upload)
  POST   /api/v1/liaison/allocation     Divide the batch (optional {students} seeds it)
  DELETE /api/v1/liaison/allocation     Clear assignments, keep the roster

HR
  /login                     Shared staff sign-in
  /login?next=/hr            Sign in
  /hr                        Invite-link manager
```
