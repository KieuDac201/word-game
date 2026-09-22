# English Game Hub

A collection of arcade-style games for practising English, built with Next.js. Every game draws
from a shared sentence library backed by Neon Postgres, with Vietnamese translations available
on demand.

## Games

| Game                     | Skills              | What you do                                                                                                                               |
| ------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ⚡ **Falling Sentences** | typing, reading     | Sentences drift down three lanes — type them accurately before they cross the danger line. Tracks WPM, accuracy, combo and mistyped keys. |
| 🚊 **Word Scramble**     | grammar, vocabulary | Drag scrambled word carriages onto a rail in the correct order to rebuild each sentence.                                                  |
| 🧩 **Fill the Blank**    | vocabulary, reading | One word is removed from each sentence — pick the right one from four options and keep the streak alive.                                  |

Each game shares the same three-screen flow: **setup → play → result**. The result screen shows
a per-sentence breakdown with expandable Vietnamese translations.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs without a database — it falls back to a bundled sentence library and shows
`Neon DB offline` in the header. To use the full library, create `.env.local`:

```bash
DATABASE_URL="postgresql://..."   # Neon connection string
```

Then seed it:

```bash
node scripts/db/seed-all.mjs          # all categories
node scripts/db/translate-all-sentences.mjs   # backfill Vietnamese translations
```

## Scripts

| Command         | Purpose                    |
| --------------- | -------------------------- |
| `npm run dev`   | Development server         |
| `npm run build` | Production build           |
| `npm start`     | Serve the production build |
| `npm run lint`  | ESLint                     |

## Architecture

Three layers, strictly one-directional — a game module never imports another game module, and
`lib/` never imports from `games/` or `app/`.

```
app/          Routes only. Each page is a one-line re-export of a game screen.
games/        One self-contained module per game + the registry that powers the hub.
lib/          Engine-agnostic core (audio, scoring, text, session) and data access.
components/   Design-system primitives and shared game scaffolding.
```

```
app/
  page.tsx                          # hub — renders from the game registry
  games/<slug>/{page,play,result}   # thin shells
  api/{categories,sentences,translate}/route.ts

games/
  types.ts        # GameDefinition, SkillTag, gameRoutes()
  registry.ts     # GAMES[] — single source of truth for the hub
  <slug>/
    definition.ts # metadata + routes
    config.ts     # tunables and presets
    types.ts      # config, round state, completion payload
    session.ts    # createGameSession<Config, Result>('<slug>')
    engine.ts     # pure game logic
    components/{setup,play,result}-screen.tsx
    index.ts      # public barrel

lib/
  theme.ts        # accent tokens mirroring globals.css
  core/           # types, constants, text, scoring, audio, session
  data/           # db, offline fallback content, sentence pool
  hooks/          # useCategories, useSentenceLibrary, useTranslations

components/
  ui/             # glass-card, neon-button, section-title, stat-tile, search-input
  game/           # category-picker, stats-grid, sentence-review-list, game-card

scripts/
  db/             # seeding, export, import, translation jobs
  seeds/          # per-category content
```

### Key contracts

**`GameDefinition`** (`games/types.ts`) — metadata the hub uses to advertise and route to a
game. Add an entry to `GAMES` and it appears on the hub automatically, including
`status: 'coming-soon'` placeholders, which render disabled.

**`createGameSession`** (`lib/core/session.ts`) — typed `sessionStorage` handoff between a
game's three screens, namespaced `<gameId>:config` / `<gameId>:result` so games never collide.

```ts
export const session = createGameSession<Config, Result>("my-game");
```

## Adding a game

1. Create `games/<slug>/` with `definition.ts`, `types.ts`, `config.ts`, `session.ts`, an
   optional `engine.ts`, `components/{setup,play,result}-screen.tsx`, and an `index.ts` barrel.
2. Add three shells under `app/games/<slug>/`:
   ```ts
   export { SetupScreen as default } from "@/games/<slug>";
   ```
3. Append the definition to `GAMES` in `games/registry.ts`.

No existing game module needs to change. See [docs/refactor-plan.md](docs/refactor-plan.md) for
the full architecture rationale.

## API

| Route                 | Description                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `GET /api/categories` | Category list with sentence counts; falls back to bundled content if the DB is unreachable. |
| `GET /api/sentences`  | Sentences filtered by `categoryId`, `difficulty`, and `limit`.                              |
| `POST /api/translate` | Batch English → Vietnamese translation, cached back into the database.                      |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Neon serverless Postgres ·
Web Audio API for synthesised sound effects (no audio assets).
