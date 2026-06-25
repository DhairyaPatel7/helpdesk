# Support Ticket Dashboard

A compact full-stack app for viewing, creating, and updating customer support
tickets. Next.js + TypeScript on the front, FastAPI + PostgreSQL on the back.

The whole thing runs with a single command via Docker, or each piece can be run
on its own for development.

## Live demo

- **App:** https://aurexillion-technical-assessment.vercel.app
- **API docs (Swagger):** https://aurexillion-api.onrender.com/docs

Sign in with the seeded demo account — **`demo@aurexillion.com` / `demo12345`** —
or register a new one.

> Hosted on Vercel (frontend), Render (backend), and Neon (Postgres). The full
> stack also runs locally with `docker compose up`.

## Tech stack

| Layer    | Choice |
| -------- | ------ |
| Frontend | Next.js (App Router), TypeScript, hand-written CSS |
| Backend  | FastAPI (Python 3.12), SQLModel, Alembic, JWT auth (bcrypt) |
| Database | PostgreSQL |
| Tests    | pytest (backend), Vitest + Testing Library (frontend) |
| Tooling  | uv, Ruff, ESLint + Prettier, Docker Compose, GitHub Actions |

## Quick start (Docker)

The only requirement is Docker. From the repository root:

```bash
docker compose up
```

That starts Postgres, runs the database migrations, seeds a handful of sample
tickets, and serves the API and the UI. Once it's up:

- Web app: http://localhost:3000
- API: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs

Ports `3000`, `8000`, and `5432` need to be free.

The dashboard is behind a login. A **demo account is seeded** so you can sign in
immediately:

- **Email:** `demo@aurexillion.com`
- **Password:** `demo12345`

You can also register a new account from the sign-in page.

## Running locally without Docker

### Backend

Requires [uv](https://docs.astral.sh/uv/) and a running PostgreSQL instance.

```bash
cd server
cp .env.example .env          # adjust DATABASE_URL if your Postgres differs
uv sync                       # installs dependencies (Python 3.12 is pinned)
uv run alembic upgrade head   # create the schema
uv run python -m app.seed     # insert sample tickets (safe to re-run)
uv run uvicorn app.main:app --reload
```

The default `DATABASE_URL` expects a database named `tickets` owned by a
`tickets` user. Create one to match, or point `DATABASE_URL` at your own.

### Frontend

Requires Node 20+.

```bash
cd client
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL, defaults to localhost:8000
npm install
npm run dev
```

Then open http://localhost:3000.

## Database and seed data

- PostgreSQL, accessed through SQLModel/SQLAlchemy.
- The schema is managed with **Alembic migrations** (`alembic upgrade head`); the
  app doesn't create tables on the fly.
- Sample data (tickets + the demo user) is inserted by `python -m app.seed`,
  which is idempotent — it only adds what's missing.
- With Docker, migrations and seeding run automatically on startup.

## Running the tests

The backend tests need a reachable Postgres server. They create the
`tickets_test` database themselves if it isn't already there, so there's nothing
to set up beyond the server:

```bash
docker compose up -d db   # or any local Postgres on localhost:5432
cd server
uv run pytest
```

**Frontend**:

```bash
cd client
npm test
```

Between them the suites cover backend validation, ticket creation, status
updates, form validation, and list rendering. Both run in CI (GitHub Actions) on
every push.

## API

REST, JSON in and out. The resource API is versioned under `/api/v1`.

| Method  | Path                    | Auth | Description |
| ------- | ----------------------- | :--: | ----------- |
| `POST`  | `/api/v1/auth/register` |  —   | Create an account, returns a token |
| `POST`  | `/api/v1/auth/login`    |  —   | Sign in, returns a token |
| `GET`   | `/api/v1/auth/me`       |  🔒  | The current user |
| `GET`   | `/api/v1/tickets`       |  🔒  | List tickets (`?status=`, `?priority=`, `?search=`, `?sort=`) |
| `GET`   | `/api/v1/tickets/{id}`  |  🔒  | Get one ticket |
| `POST`  | `/api/v1/tickets`       |  🔒  | Create a ticket (always starts `open`) |
| `PATCH` | `/api/v1/tickets/{id}`  |  🔒  | Update a ticket (primarily its status) |
| `GET`   | `/api/health`           |  —   | Liveness check |

Endpoints marked 🔒 require an `Authorization: Bearer <token>` header; obtain the
token from `login` or `register`.

A ticket looks like:

```json
{
  "id": 1,
  "title": "Unable to complete payment",
  "description": "The customer receives an error after submitting the payment form.",
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "status": "open",
  "priority": "high",
  "createdAt": "2026-06-18T10:30:00Z",
  "updatedAt": "2026-06-18T10:30:00Z"
}
```

Statuses are `open`, `in_progress`, `resolved`; priorities are `low`, `medium`,
`high`. Validation errors return `422`, a missing ticket returns `404`, and an
empty update returns `400`.

## Project structure

```
client/   Next.js + TypeScript frontend
  app/        routes (list, board, tickets/new, tickets/[id], login, register)
  components/ presentational + interactive components
  lib/        typed API client, types, formatting
server/   FastAPI backend
  app/        main, routes, auth, security, models, schemas, database, seed, config
  migrations/ Alembic migrations
  tests/      pytest suite
```

## Assumptions and trade-offs

- **API versioning.** Endpoints live under `/api/v1` rather than the brief's
  literal `/api/tickets`. The brief allows a different route structure as long as
  it's documented — versioning keeps the response contract free to evolve without
  breaking clients.
- **Extra `updated_at` field.** Beyond the required fields, tickets carry an
  `updated_at` timestamp (bumped on every change), which the details page shows
  as "last updated".
- **camelCase JSON, snake_case database.** The database columns are snake_case;
  the API speaks camelCase to read naturally in the TypeScript frontend. The two
  are mapped explicitly at the route boundary.
- **One `Ticket` table.** Customers aren't modelled separately — name and email
  live on the ticket, which is enough for this scope.
- **Status updates happen on the details page** via an accessible select. The
  brief allows the control on the list or the details view; details keeps the list
  clean.
- **Authentication.** The dashboard is gated behind email/password login (JWT
  access tokens, bcrypt-hashed passwords). The brief lists auth as optional and
  defines no user model, but since this is **deployed live**, leaving it fully
  open-ended didn't seem the right call — anyone could create or modify tickets.
  Tickets are shared across all authenticated users (no per-user ownership),
  which keeps the single-dashboard model the brief describes.
- **Hand-written CSS** instead of a component library, to keep the bundle small
  and the styling easy to read.
- **Postgres over SQLite.** Heavier to set up locally, so Docker Compose provides
  it; the brief accepts either.

## What I'd add with more time

- Pagination for large ticket volumes (sorting is implemented; pagination was
  left out as over-engineering for the current dataset).
- Per-user ticket ownership and roles — the current auth is shared-access.
- WebSocket live updates, which mainly pay off once several agents use the board
  concurrently.
- Optimistic-update rollback and more frontend tests (details page, error paths).
- An end-to-end test (Playwright).
