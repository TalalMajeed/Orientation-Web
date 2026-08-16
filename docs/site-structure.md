# Site structure — NUST Orientation '26

A route-by-route map of the app: the public website, and the staff panels behind
it.

---

## 1. Public website

No login required.

| Route | Purpose |
|---|---|
| `/` | Landing page: entry gate (WebGL night sky) → hero video → Welcome / Orientation → Schedule → Events → Contact + campus map → newsletter and footer. |
| `/schedule` | Orientation Week schedule. Marked "coming soon" until timings are finalized. |
| `/map` | Interactive H-12 campus map (Leaflet + CARTO tiles), filterable by category, with a recenter control. |
| `/contact` | Contact details, a quick message form that opens a prefilled mail draft to `support@orientation.nust.edu.pk`, and the campus map. |
| `/societies` | Society directory (placeholder profiles until societies confirm). |
| `/privacy`, `/terms` | Legal pages, rendered from `components/section/legal.tsx`. |

**Shared chrome:** every page mounts `components/site/chrome.tsx` (theme toggle,
film grain, cookie consent) and closes with `components/section/footer.tsx`
(newsletter + footer). Sub-pages get the sticky `components/site/nav.tsx`; the
landing page uses the hero's own top bar instead.

---

## 2. Staff panels

| Panel | Entry point | Who signs in | What it does |
|---|---|---|---|
| **Admin hub** | `/admin` | anyone | Directory of the panels below — not a login form. |
| **Liaison** | `/login?next=/liaison` → `/liaison` | OG team (`LIAISON_USERNAME` / `LIAISON_PASSWORD`) or admin | Manage the 10 OG houses and their OGs, upload or generate a batch, auto-divide it across houses and groups (gender + school balanced), review and export. |
| **HR** | `/login?next=/hr` → `/hr` | admin (`HR_USERNAME` / `HR_PASSWORD`) | Create, edit and delete short invite links (`/invite/<code>`). |

`/hr/login` and `/liaison/login` are permanent aliases that redirect to the
shared staff login, so old bookmarks keep working.

### Access model

- **Sessions:** HMAC-signed cookie (`services/auth/session.ts`), 8 hours, roles
  `admin` and `liaison`. The role sits *inside* the signed payload, so a cookie
  cannot be edited to claim a different one.
- **Guards:** `proxy.ts` redirects requests without the right role to
  `/login?next=<path>` (or to the role's own landing page, carrying `?denied=`,
  when they are signed in as the wrong role). That redirect is convenience —
  every route handler calls `requireRole` itself.
- **Rate limits:** per-IP fixed window on `/api/*` and `/invite/*` — 10 sign-ins
  per 15 min, 3 per 10 min on the contact POST (each one sends real mail),
  10/hour on the public newsletter POST, 60 writes and 200 reads per
  minute elsewhere. In memory, so budgets are per instance
  (`services/security/limit.ts`); a shared store or the edge is the real fix for
  multi-instance deployments.
- **Headers:** CSP, HSTS (https only), `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and the
  cross-origin isolation headers on every response
  (`services/security/headers.ts`). `script-src` keeps `'unsafe-inline'` because
  Next inlines its bootstrap and the pre-paint theme script; a nonce would opt
  every static page out of prerendering.

---

## 3. Liaison API

Every endpoint requires a `liaison` or `admin` session and answers with the
whole workspace (`{ state }`), so the client replaces its state rather than
merging. The workspace is one MongoDB document — allocation rewrites every
student at once, which makes a single document both the natural and the atomic
unit.

```
GET    /api/v1/liaison/state          Read the workspace
DELETE /api/v1/liaison/state          Clear everything back to seeded houses
PATCH  /api/v1/liaison/config         Set or clear the per-house capacity
GET    /api/v1/liaison/houses         The 10 houses and their OGs
PATCH  /api/v1/liaison/houses/[id]    Rename the OL ({ol}) or an OG ({ogId,name})
POST   /api/v1/liaison/houses/reseed  Restore the seeded houses
GET    /api/v1/liaison/students       The roster + parse log
PUT    /api/v1/liaison/students       Replace the roster (an upload is a new batch)
POST   /api/v1/liaison/allocation     Divide the batch (optional {students} seeds it first)
DELETE /api/v1/liaison/allocation     Clear assignments, keep the roster
```

Workbooks are parsed in the browser (`components/liaison/sheet.ts`, cell values
only), and every field is re-validated server-side in
`services/liaison/validate.ts`. Allocation itself runs on the server
(`services/liaison/allocate.ts`) so the rule that decides which student lands
where cannot be edited in devtools.

### Other endpoints

```
POST   /api/v1/auth/login             Sign in (returns the role, sets the cookie)
DELETE /api/v1/auth/login             Sign out
GET    /api/v1/hr/links               List invite links (admin)
POST   /api/v1/hr/links               Create an invite link (admin)
PATCH  /api/v1/hr/links/[shortId]     Retarget a link (admin)
DELETE /api/v1/hr/links/[shortId]     Delete a link (admin)
POST   /api/v1/contact                Contact form -> email to support@ (public)
POST   /api/v1/newsletter             Public newsletter subscribe
GET    /api/v1/newsletter             List subscribers (admin)
DELETE /api/v1/newsletter             Unsubscribe an address (admin)
GET    /invite/[id]                   Redirect to a link's target
GET    /robots.txt, /sitemap.xml      Generated by app/robots.ts, app/sitemap.ts
```

### Contact form and email

`POST /api/v1/contact` renders the message in `services/contact/message.ts` and
sends it through `services/email/graph.ts`. Notes that are not obvious from the
code:

- **App-only Graph.** `TENANT_ID` / `CLIENT_ID` / `CLIENT_SECRET` acquire a
  client-credentials token; there is no signed-in user, so `/sendMail` has to
  name the mailbox it speaks for — `MS_GRAPH_SENDER`.
- **The sending mailbox is the constrained one.** It must sit inside the
  Exchange `ApplicationAccessPolicy` for this app registration or the send fails
  with `ErrorAccessDenied` — "[RAOP] : Blocked by tenant configured AppOnly
  AccessPolicy settings", a tenant-side block no code change can work around.
  Verified against the live tenant: `HR@` (2026-07-22) and `info@` (2026-07-23,
  after IT widened the policy); `it@` and `support@` were blocked as of
  2026-07-22. `npm run mail-check <address>` re-checks a mailbox — the roles
  check covers the Mail.Send grant, the test send covers the policy.
- **`support@` is only the recipient here**, so that policy does not apply to it.
- `Reply-To` carries the visitor's address so staff answer from the inbox
  directly. The subject collapses whitespace, since a newline in a header is a
  header-injection vector.
- The body is HTML-escaped, with `\n` turned into `<br />` to keep the
  textarea's line breaks.

### Newsletter storage

Addresses are lowercased and trimmed into the `newsletter` collection, which
carries a unique index on `email`. Subscribe inserts blind and treats a
duplicate-key error as "already subscribed", so two simultaneous submissions of
one address cannot both pass a read check and write two rows. Index creation is
best-effort — if it fails the insert still rejects duplicates, just more slowly.

---

## 4. Design tokens

All colours are CSS custom properties in `app/globals.css` — change a token
once, it updates everywhere.

| Token | Role |
|---|---|
| `--color-surface` / `--color-fg` | Page background / text. Flips per `data-theme` (light `#F2F7FF`, dark `#0B0F18`). |
| `--color-inverse-surface` / `--color-inverse-fg` | Always the opposite of the pair above — used by the permanently inverted footer band. |
| `--color-ember` | Shared accent (buttons, CTAs, highlights) — blue `#2A5290`. |
| `--color-sky` / `--color-navy` / `--color-blue` / `--color-blue-light` | Fixed brand blues (gender dots, accents). |
| `--color-ink` / `--color-cream` | Fixed dark and light, used over media where the theme must not flip. |

Fonts: `font-serif` (ITC Garamond, display headings), `font-mono` (IBM Plex
Mono, labels and eyebrows), `font-italic` (Niveau Grotesk), `font-urdu`
(Rakkas), `font-sans` (Poppins, body).

Raw CSS classes: `.link-sweep` (hover underline sweep), `.orbit` (90s ellipse
rotation), `.grain-overlay` (site-wide film grain), `.no-spinner` (compact
number inputs), plus the Leaflet zoom-control restyle.
