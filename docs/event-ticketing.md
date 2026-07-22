# Event Ticketing

## Context

Orientation needs a way to control who gets in. Staff issue a ticket to a named
person, that person receives a QR code by email, and at the gate a staff member
scans it. **A ticket admits exactly one person, exactly once.** That single
property is the reason this system exists; everything else is convenience.

The original design brief was written against Supabase/Postgres/Resend. This
repo runs MongoDB (`lib/mongodb.ts`), sends mail through Microsoft Graph
(`services/email/graph.ts`), and authenticates with an HMAC-signed cookie
(`services/auth/session.ts`). This document is that brief re-derived against
what is actually here.

Scale: **~500–2000 attendees, 1–2 gates.** Several orientation sessions
(per school / per day), so events are a real dimension.

### Decisions that differ from the original brief, and why

| Decision | Reason |
| --- | --- |
| MongoDB, not Postgres | `findOneAndUpdate` is atomic on a single document — the same one-winner guarantee, no transactions, no second datastore |
| No CNIC / no ID document | The ID only existed to bind ticket→human. We soft-enforce with the holder's name instead. Removes the PII branch, the format validation, and the international-student edge case |
| `email` is the dedupe key | Normalised `trim().toLowerCase()` before indexing, the same trap the brief flagged for CNIC dashes |
| `activeKey` field instead of a `status != 'revoked'` partial index | Mongo's `partialFilterExpression` rejects `$ne`. `activeKey` works on every server version and makes the invariant self-documenting |
| `tokenHashes` is an **array**; resend appends | The brief rotated the token, creating a window where a failed send leaves the holder with a dead QR and no replacement. Appending has no such window, and single-use is enforced by `status`, not by the token |
| Bulk rows carry **no token** until send time | The raw token is never stored, so it cannot be recovered later — whoever mints a token must be the one that delivers it |
| QR delivered as a CID inline attachment | Gmail strips `<img src="data:...">`. A data-URI QR renders as a broken image for a large share of attendees |
| Bulk issue writes rows, a drain endpoint sends | 2000 mails under Graph throttling is >1h of wall clock — it cannot complete inside one request on any serverless host. `emailSentAt` doubles as the resume cursor |
| Manual search + check-in at the gate | The brief has no answer for a dead phone or a QR that will not scan. Without it the queue stalls and staff start waving people through unlogged |
| A `wrong_event` result | With several sessions, a Day 1 ticket at the Day 2 gate would otherwise read as a valid admission |
| Offline mode **cut** | It deletes the guarantee the system exists for — two offline phones cannot see each other's scans. At 1–2 gates the fix is a mobile-data SIM and the manual fallback |
| No rate limiter on check-in | Guessing a 32-byte token needs ~2^128 attempts *and* a valid scanner session. Every failed scan is logged instead, which gives detection — the part with actual value |
| Visual + audio feedback, vibration optional | `navigator.vibrate` does not exist on iOS Safari. Never rely on it for the failure case |

### Accepted risks

- **Tickets are transferable in practice.** A forwarded QR admits whoever
  arrives first. Soft enforcement (staff read the name off the panel) catches
  the careless case, not the deliberate one. Fine for orientation; revisit
  before reusing this for anything with paid or scarce seats.
- **`sendMail` had never been executed before this work.** It now has
  attachment support and is wired in, but the first real send is still the
  first proof that the mailbox in `MS_GRAPH_SENDER` actually grants this app
  registration the Mail.Send application permission.

---

## Architecture

```
app/
  event-tickets/            role: admin
    page.tsx                counters, event picker, event creation
    issue/                  single issue, bulk CSV, send queue
    list/                   table, search, filters, revoke, resend, export
  scan/                     role: scanner or admin — top level, staff type it
  login/                    shared login, redirects by role
  api/v1/
    auth/login              POST sign in, DELETE sign out
    checkin                 POST — the atomic update
    checkin/manual          POST — same update, keyed on _id
    events                  GET (both roles), POST (admin)
    event-tickets           GET list + stats, POST issue
    event-tickets/[id]      DELETE revoke, POST resend
    event-tickets/bulk      POST — inserts rows only
    event-tickets/drain     POST send a batch, GET queue depth
    event-tickets/export    GET CSV
    event-tickets/search    GET — gate lookup, both roles
proxy.ts                    role gating and redirects
services/
  auth/session.ts           signed cookie with a role
  auth/guard.ts             requireRole() for route handlers
  tickets/                  qr, tokens, types, db, events, tickets, mail,
                            csv, time, request
  email/graph.ts            Graph sendMail, with attachments
components/tickets/         Overview, IssuePanel, TicketList, Scanner
scripts/e2e.mjs             npm run e2e
```

### Collections

```js
// events
{ _id, name, startsAt, venue, createdAt }

// event_tickets
{ _id, eventId, holderName, email,          // email normalised lowercase
  activeKey: `${eventId}:${email}`,          // $unset on revoke
  tokenHashes: [ sha256hex ],                // ABSENT until first mint
  status: 'issued' | 'used' | 'revoked',
  issuedAt, emailSentAt, emailError, emailAttempts,
  usedAt, usedGate, usedVia, revokedAt }     // usedVia: 'scan' | 'manual'

// scan_log
{ _id, eventId, ticketId, result, via, gate, scannedAt }
//   result: valid | already_used | revoked | not_found | wrong_event
```

### Indexes

```js
event_tickets: { tokenHashes: 1 }  unique, partial { tokenHashes: { $exists: true } }
               { activeKey: 1 }    unique, partial { activeKey:   { $exists: true } }
               { eventId: 1, status: 1 }
               { eventId: 1, emailSentAt: 1 }     // drain cursor
               { eventId: 1, holderName: 1 }
               { eventId: 1, email: 1 }
scan_log:      { eventId: 1, scannedAt: -1 }
```

Both unique indexes are partial for the same reason: a **missing field indexes
as a single null key**, so without the filter every token-less bulk row would
collide with every other one, and every revoked ticket with every other revoked
ticket. `activeKey` present means "this ticket is live" — revoke MUST `$unset`
it, and `tests/checkin.test.ts` covers both directions.

### Tokens

- 32 random bytes from `crypto.randomBytes`, base64url encoded.
- QR payload is `OW1:<token>`. The prefix lets the scanner discard every other
  QR in the world without a network round trip or a junk `scan_log` row, and
  versions the format.
- Only `sha256(token)` is stored. The raw token goes memory → QR → email and is
  then gone: never logged, never returned as a field, never persisted.

### The core rule

```js
const admitted = await tickets.findOneAndUpdate(
  { tokenHashes: hash, eventId, status: "issued" },
  { $set: { status: "used", usedAt: new Date(), usedGate, usedVia: "scan" } },
  { returnDocument: "after" }
);
```

Non-null → admit. Null → one `findOne({ tokenHashes: hash })` classifies it as
`already_used` / `revoked` / `not_found` / `wrong_event`. Mongo guarantees only
one concurrent caller matches `status: "issued"`. A ticket that still reads
`issued` on the second query means another scan won the race in between, which
is an already-used outcome rather than a miss.

Manual check-in runs the identical update keyed on `_id`, so it cannot
double-admit either.

---

## Auth

`services/auth/session.ts` signs `${expiresAt}:${role}` **as one string**. A
role appended outside the signature could be rewritten from `scanner` to
`admin` by the cookie holder; `npm run e2e` asserts that a tampered cookie is
rejected.

- `HR_USERNAME` / `HR_PASSWORD` → role `admin` (the HR invite-link panel keeps working)
- `SCANNER_USERNAME` / `SCANNER_PASSWORD` → role `scanner` (optional; if unset, nobody can log in as one)

`scanner` reaches `/scan`, `POST /api/v1/checkin`, `POST /api/v1/checkin/manual`,
`GET /api/v1/events` and the narrow gate search — nothing else. It cannot list,
issue, revoke, or export, so a phone left unlocked at the gate costs you
"someone can scan tickets", not a full attendee dump.

`proxy.ts` (Next 16's replacement for `middleware.ts`) handles redirects.
It always runs on the Node runtime, so it reuses the real session module rather
than a second Web Crypto implementation — but it is **not** the security
boundary: every route handler calls `requireRole` itself.

---

## Email

`services/email/graph.ts` accepts `attachments` using Graph's `fileAttachment`
shape, with `contentId` + `isInline` for the CID image. The QR ships twice:
inline for clients that render CID images, and as a plain attachment for the
ones that block them. Config is read lazily, so a missing variable fails the one
request that sends mail rather than every route that imports the module.

Sending is a queue, not a loop:

1. Bulk upload **inserts rows only** — fast, fits one request, `emailSentAt: null`
   and no token yet.
2. `POST /api/v1/event-tickets/drain` mints a token for each pending ticket and
   sends it, then returns.
3. The issue page drives that endpoint in a paced loop — 10 per batch every
   20s, just under Graph's ~30/min — with a progress log and a Stop button.

`emailSentAt` is the cursor, so a crash, a timeout, or a closed tab resumes
exactly where it stopped. `emailAttempts` bounds retries at
`MAX_EMAIL_ATTEMPTS`, since each retry mints a fresh token; the resend button
resets it. Throttling (429/503/504) stops the batch **without** spending an
attempt.

Email copy: holder name, event name / date / time / venue, the QR large on
white, a line saying the ticket admits one person once and must not be shared,
and a line asking them to bring their student ID or admission letter.

---

## Scanner (`/scan`)

- Event and gate chosen once, kept in `localStorage`.
- "Start scanning" arms the camera **and** unlocks audio — iOS blocks sound
  until a user gesture.
- Result panel fills the viewport. **The holder's name is the largest element**:
  under soft enforcement the name *is* the check.
  - green `valid` · red `already used` with the first-used time and gate · red
    `not found` · red `wrong event` · grey `revoked`
- Distinct beeps for pass and fail; `navigator.vibrate` behind a feature check.
- Same token suppressed for 3s — the camera decodes many times per second.
- A token **this device** admitted within 60s shows **amber, "You admitted this
  14s ago"**, not red. Otherwise staff see a hard red for someone they
  personally waved through, decide the system is broken, and stop trusting red
  screens for the rest of the night.
- A network failure never shows green — it says it could not verify.
- Last 5 scans listed; running checked-in count comes back with each response.
- "Can't scan?" → search by name or email → tap to check in manually.

---

## Status

Built and verified: auth and roles, the data layer, the atomic check-in with
its test suite, the issue form with on-screen QR, the ticket list, the scanner
with its manual fallback, email with CID attachments, the send queue, bulk CSV
import, and CSV export. Offline mode was cut deliberately.

Not verified: a real email actually arriving. That needs live Graph
credentials — the code path is exercised, and a failure is reported per
recipient without marking the ticket delivered.

## Tests

`npm test` — 35 unit tests. The check-in suite runs against a **real `mongod`**
via `mongodb-memory-server`, not a mock; single-document atomicity holds on a
standalone server, so no replica set is needed.

- Two check-ins for one token → first `valid`, second `already_used`
- **Ten concurrent check-ins for one token → exactly one `valid`.** This is the
  test that proves the system works. It has teeth: the read-then-write
  implementation this design rejects admits ~8 of 10 under the same conditions
- Unknown token → `not_found`; other event's gate → `wrong_event`
- Revoked ticket → `revoked`, and its status does not become `used`
- Second issue for the same email + event → rejected by the unique index,
  including differently cased and padded spellings
- Revoke `$unset`s `activeKey`, so re-issuing to that person then succeeds; a
  person who already attended is *not* freed
- Resend appends a hash; the **old** QR still checks in, and still only once
- Token-less bulk rows do not collide with each other
- The retry budget stops a permanently failing send; resend restores it
- The raw token appears in no response, no stored document, and no scan_log row

`npm run e2e` — 35 checks against a real `mongod` **and** a real Next server,
started and torn down by the script. Covers role separation, cookie tampering,
redirects, the race over HTTP, the gate fallback, bulk, the send queue, the
lifecycle, and the export.

## Verification

```bash
npm test        # unit + concurrency, real mongod
npm run e2e     # full HTTP walkthrough, real server
npm run build   # type + route check
npm run dev     # esecrets injects env
```

By hand: log in as admin → create an event → issue a ticket to yourself →
confirm the QR renders and the email arrives → open `/scan` on a phone (the
camera needs HTTPS or localhost) → scan → green with your name → scan again →
amber → wait 60s → scan again → red "already used". Then revoke a ticket and
confirm grey.

## Housekeeping

`secrets.json` — written to the repo root by `secrets.js` with every production
secret in it — was **not** in `.gitignore` (`.env*` does not cover it). One
`git add -A` would have committed prod credentials. Now ignored.
