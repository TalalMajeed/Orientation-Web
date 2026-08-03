# Site structure — NUST Orientation '26

A page-by-page map of every route in the app: the public marketing site, and
the five staff/admin panels behind it. See `docs/event-ticketing.md` for the
ticketing system's data model and API design.

---

## 1. Public website

The marketing site. No login required for any of these.

| Route | Purpose |
|---|---|
| `/` | Landing page. Entry gate (WebGL intro) → hero video → Welcome to NUST / Orientation → Schedule → Campus Map → Events (Scavenger Hunt + Social Night teasers) → Contact form → newsletter/footer. |
| `/schedule` | Full day-by-day orientation schedule (Day 01–03 tabs). Currently marked "coming soon" — no times are finalized. |
| `/map` | Interactive campus map (Leaflet + CARTO tiles), filterable by category (Gates, Mosques, Sports, Hostels, Schools, Cafes, Banks, Facilities), with zoom controls and a recenter button. |
| `/passes` | Public ticket showcase — the two passes (Concert Night, Qawwali Night) as ticket-styled cards. Links to the real issuing flow at `/event-tickets` (staff-only). |
| `/scavenger-hunt` | Public leaderboard for the scavenger hunt (see §3, Hunt). |
| `/contact` | Full contact page: "Email the team" CTA, a quick Name/Email/Message form that hands off to the Support Desk's Issue Ticket page (prefilled), contact-detail cards, and social links. |
| `/about`, `/plan`, `/gallery` | Placeholder content pages (static copy, not yet built out). |
| `/privacy`, `/terms` | Legal boilerplate. |

**Shared chrome:** `WebsiteChrome` (theme toggle, film grain, smooth scroll) and `PageNav` (sticky header with logo + Schedule/Map/Tickets/Hunt/Contact nav) wrap every page above except the homepage, which uses `DwHero`'s own top bar instead.

---

## 2. Admin hub

`/admin` is a branded directory, not a login form — it lists every panel below with a one-line description and links straight to that panel's own sign-in.

---

## 3. Staff panels

Five separate systems, each with its own login and its own audience.

| Panel | Entry point | Who signs in | What it does |
|---|---|---|---|
| **Liaison** | `/liaison/login` | OG team (demo creds: `liaison` / `orientation26`, client-side only — see note below) | Manage the 10 OG Houses and their OGs, upload/generate a student batch, auto-divide it across houses & groups (gender + school balanced), review and export. |
| **Socials** | `/socials` | Scanner or admin role | Gate check-in scanner. Self-gating page — shows its own login until a session exists, then renders the camera scanner directly (no separate `/scan` login; `/scan` just redirects here). |
| **Event Tickets** | `/login` → `/event-tickets` | Admin role | Issue/email tickets (single or bulk CSV), manage the send queue, browse & search all tickets, revoke/resend. |
| **Support Desk** | `/tickets/login` → `/tickets` | (Static UI mock — no backend yet) | Ticket hub, issue/list/approve/users/admin-panel pages for a student-helpdesk system. Distinct from Event Tickets — this is generic support requests, not event passes. |
| **HR** | `/login?next=/hr` → `/hr` | Admin role | Create/manage short invite links (`/invite/<code>` → redirects to a target URL). |
| **Scavenger Hunt (admin)** | `/login?next=/hunt` → `/hunt` | Admin or hunt role | Generate/manage hunt QR codes, print code sheets (`/hunt/print`). Public redemption happens at `/hunt/c/[code]` (no login — that's the page a student's phone opens when they scan a code in the field). |

### Access model

- **Real staff auth** (Event Tickets, Support Desk-intent, HR, Hunt, Socials): HMAC-signed session cookie (`services/auth/session.ts`), roles `admin` / `scanner` / `hunt`. `proxy.ts` redirects unauthenticated requests to `/login?next=<path>`; every route handler re-checks the session itself (the proxy redirect is convenience, not the security boundary).
- **Liaison**: demo-only, client-side `localStorage` flag — **not real auth**, intended for placeholder/demo credentials until a real backend login is wired up (see `components/liaison/auth.ts`).
- **`/socials`**: not in the proxy's guard list — it renders its own login (`SocialsLogin`) when unauthenticated and the scanner when a `scanner`/`admin` session exists, so it never bounces through `/login`.

---

## 4. Design system reference

All colors are CSS custom properties in `app/globals.css` (`@theme` blocks) — change a token once, it updates everywhere:

| Token | Role |
|---|---|
| `--color-surface` / `--color-fg` | Page background / text. Flips per `data-theme` (light: near-white blue `#F2F7FF`; dark: `#0B0F18`). |
| `--color-inverse-surface` / `--color-inverse-fg` | Always the *opposite* of surface/fg — used for the permanently-inverted footer band (`DwContact`) so it contrasts regardless of site theme. |
| `--color-ember` | Shared accent (buttons, CTAs, highlights) — currently blue (`#2A5290`), drawn from the palette's own `--color-blue`. |
| `--color-sky` / `--color-navy` / `--color-blue` / `--color-blue-light` | Fixed brand blues, used directly in a few places (ticket gradients, gender-color dots). |
| `--color-cream` | Legacy name, now aliased to the same value as `--color-surface` — no separate "cream/white" color exists anymore. |

Fonts: `font-serif` (ITC Garamond, display headings), `font-mono` (IBM Plex Mono, labels/eyebrows), `font-italic` (Niveau Grotesk), `font-urdu` (Rakkas, RTL accent lines).

---

## 5. Full route table

```
Public site
  /                          Landing
  /schedule                  Schedule
  /map                       Campus map
  /passes                    Ticket showcase
  /scavenger-hunt            Hunt leaderboard (public)
  /contact                   Contact + quick message form
  /about  /plan  /gallery     Placeholder pages
  /privacy  /terms           Legal

Admin hub
  /admin                     Portal directory

Liaison
  /liaison/login             Sign in (demo creds)
  /liaison                   Dashboard (Overview / Houses / Students / Allocation)

Socials (gate scanner)
  /socials                   Self-gating login + scanner
  /scan                      Redirects to /socials

Event Tickets (staff)
  /login                     Shared staff sign-in
  /event-tickets              Overview
  /event-tickets/issue        Issue tickets
  /event-tickets/list         All tickets

Support Desk (mock)
  /tickets/login             Sign in (non-functional mock)
  /tickets                   Hub
  /tickets/issue              Issue a ticket (accepts ?subject=&body= prefill)
  /tickets/list                All tickets
  /tickets/approve            Approve tickets
  /tickets/users               Users
  /tickets/panel                Admin panel
  /tickets/[id]                Ticket detail

HR
  /login?next=/hr            Sign in
  /hr                        Invite-link manager

Scavenger Hunt (admin)
  /login?next=/hunt          Sign in
  /hunt                      Manage codes
  /hunt/print                 Print code sheets
  /hunt/c/[code]              Public redemption page (no auth)
```
