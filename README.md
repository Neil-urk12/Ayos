# Ayos

Community issue reporting. Residents report local problems from the mobile app and track them on a map. Staff review reports and merge duplicates from the web dashboard.

## Structure

| Path          | What                                                    |
| ------------- | ------------------------------------------------------- |
| `apps/mobile` | Resident app: Expo + Expo Router (React Native)         |
| `apps/web`    | Staff dashboard: SvelteKit                              |
| `firebase`    | Firestore and Storage security rules, Firestore indexes |

Backend is Firebase (Auth, Firestore, Storage).

## Setup

Requires Node and pnpm.

```bash
pnpm install
cp apps/mobile/.env.example apps/mobile/.env.local   # fill in your Firebase web app config
```

## Scripts

Run from the repo root:

```bash
pnpm mobile      # start the Expo dev server
pnpm web         # start the SvelteKit dev server
pnpm lint        # lint all apps
pnpm fmt         # format with oxfmt (fmt:check to verify)
```

## Firebase

Rules and indexes are configured in `firebase.json`. With the Firebase CLI:

```bash
firebase emulators:start                    # local Auth, Firestore, Storage + UI
firebase deploy --only firestore,storage    # deploy rules and indexes
```
