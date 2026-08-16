# Contributing

## Setup

```bash
npm install
npx next dev     # website only
npm run dev      # everything (needs SECRETS_KEY)
```

## Conventions

- **Filenames:** one lowercase word plus the extension — `hero.tsx`, `limit.ts`.
  Folders follow the same rule. Next's own names (`page.tsx`, `layout.tsx`,
  `route.ts`, `proxy.ts`) are the only exceptions.
- **No comments.** Name things so the code reads on its own. If a decision needs
  explaining, it belongs in `docs/site-structure.md` or the PR description.
- **Imports:** always the `@/` alias, never `../`.
- **Where code goes:**
  - `app/` — routes only; keep pages thin and compose components.
  - `components/site` site-wide UI · `components/section` landing sections ·
    `components/campus` map · `components/liaison`, `components/hr` panels.
  - `services/` — server-only logic. Anything touching the database, secrets or
    sessions starts with `import "server-only"`.
  - `lib/` — small helpers shared by both sides.
- **Styling:** Tailwind utilities with the theme tokens (`bg-surface`,
  `text-fg`, `text-ember`). Add a raw CSS class in `app/globals.css` only when
  utilities cannot express it. Never hard-code a hex that a token covers.
- **Validation:** re-validate every request body server-side; never trust a
  shape that came from the browser.

## Before opening a PR

```bash
npm run lint
npm test
npm run build && npm run e2e     # if you touched the API or the liaison panel
```

All four must pass. Keep the change focused, and update
`docs/site-structure.md` when you add or move a route.

## Commits

Short, imperative subject lines — `Add societies page`, `Fix hero volume fade`.
