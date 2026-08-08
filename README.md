# Heilthy

Arabic-first daily nutrition tracker. Each account has its own meals, goals and
history; log food by photo or by hand and follow your progress over time.

## Features

- **Accounts** — username + password sign-up, scrypt-hashed passwords, 90-day sessions stored server side.
- **Per-user data** — meals, goals, preferences and favourites are scoped to the signed-in account.
- **Photo logging** — upload a meal photo, review the detected items and portions, then save.
- **Manual logging** — search the built-in food table, pick a serving or grams, and build a meal.
- **Daily goals** — set calories and let the app derive protein / carbs / fat, or enter them yourself.
- **Insights** — 7 / 30 / 90-day calorie trend, macro split, adherence, streak and best / worst day.
- **Calendar** — month view with per-day totals and drill-down.
- **Export** — download the whole log as UTF-8 CSV.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3000> and create an account.

## Environment variables

| Variable      | Required | Purpose                                                                                     |
| ------------- | -------- | ------------------------------------------------------------------------------------------- |
| `AI_PROVIDER` | no       | Set to `openai` to enable real photo analysis. Anything else runs demo mode.                  |
| `AI_API_KEY`  | with the above | OpenAI API key used by the vision request.                                            |
| `DATA_DIR`    | no       | Directory holding `db.json`. Defaults to `./data`.                                            |

## Deployment — read this first

Data is stored in a single JSON file (`$DATA_DIR/db.json`). That means the host
**must give the app a persistent, writable disk**:

- **Works:** a VPS, Railway / Render / Fly.io with a mounted volume, Docker with a bind mount.
  Point `DATA_DIR` at the mount (for example `/data`).
- **Does not work:** Vercel, Netlify, Cloudflare Pages and other read-only serverless
  platforms. The filesystem there is ephemeral, so every account and meal disappears
  on the next deploy or cold start.

Also set `NODE_ENV=production` so session cookies are marked `secure`, and serve
the site over HTTPS.

## Scripts

| Command                                            | Description                                     |
| -------------------------------------------------- | ----------------------------------------------- |
| `npm run dev`                                      | Development server                              |
| `npm run build`                                    | Production build                                |
| `npm run start`                                    | Serve the production build                      |
| `npm run lint`                                     | ESLint                                          |
| `node scripts/seed-demo.mjs seed \| restore`       | Fill the database with demo meals, or undo it   |
| `powershell -File scripts/auth-smoke.ps1`          | End-to-end auth + data-isolation test (dev server must be running) |

## Project layout

```
app/            routes, pages and API handlers
components/     UI components
lib/            db, auth, sessions, nutrition maths, date helpers
types/          shared TypeScript types
data/db.json    the database
proxy.ts        edge gate that redirects signed-out visitors to /login
```
