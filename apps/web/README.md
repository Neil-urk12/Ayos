# Ayos staff dashboard

SvelteKit app for LGU staff: the priority queue, duplicate review, and the priority weights
page. Built as a static single-page app for Firebase Hosting (`build/`, see `firebase.json`).
See the root `README.md` for the whole monorepo.

## Setup

```sh
cp .env.example .env   # Firebase web app config, same project as the mobile app
```

## Scripts

Run from `apps/web`:

```sh
pnpm dev         # dev server
pnpm build       # static build into build/
pnpm check       # svelte-check
pnpm lint        # eslint
pnpm set-staff   # grant or revoke staff access (scripts/set-staff.mjs)
pnpm seed        # seed tips and settings/priority (scripts/seed.mjs)
```

## Tests

`src/**/*.test.ts` run against the Auth and Firestore emulators. From the repo root:

```sh
pnpm test:web
```
