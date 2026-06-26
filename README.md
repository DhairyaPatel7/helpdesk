# Support Ticket Dashboard

[![CI](https://github.com/DhairyaPatel7/aurexillion-technical-assessment/actions/workflows/ci.yml/badge.svg)](https://github.com/DhairyaPatel7/aurexillion-technical-assessment/actions/workflows/ci.yml)

A compact full-stack app for viewing, creating, and updating customer support
tickets. Next.js + TypeScript on the front, FastAPI + PostgreSQL on the back.

The whole thing runs with a single command via Docker, or each piece can be run
on its own for development.

## Live demo

- **App:** https://aurexillion-technical-assessment.vercel.app
- **API docs (Swagger):** https://aurexillion-api.onrender.com/docs

Sign in with the seeded demo account (**`demo@aurexillion.com` / `demo12345`**)
or register a new one.

> Hosted on Vercel (frontend), Render (backend), and Neon (Postgres). The full
> stack also runs locally with `docker compose up`.

## Features

### Core requirements

- [x] **Ticket list** showing title, customer, status, priority and created date
- [x] **Create ticket** form that validates the required fields and the email format; new tickets always start as `open`
- [x] **Update status** from the details page, persisted to the database, with success and error feedback
- [x] **Ticket details** view with the full description, customer information, priority, status and timestamps
- [x] **Filtering** by status and priority

### Optional enhancements

- [x] **Drag-and-drop Kanban board**: move cards across columns to change status, and reorder them within a column; both the status and the order persist across a refresh
- [x] **Search** tickets by title or customer name
- [x] **Pagination and sorting** (newest, oldest, priority), both applied on the server
- [x] **Docker Compose** setup for a one-command run
- [x] **Authentication** with email and password (JWT access tokens, bcrypt hashing)
- [x] **Swagger / OpenAPI** documentation at `/docs`
- [x] **Deployment** to the cloud (Vercel, Render, Neon)
- [x] **Additional automated tests** and a CI pipeline running both suites
- [x] **Accessibility** improvements (keyboard-usable controls, labelled inputs, focus states)
- [ ] **WebSocket live updates** (not implemented; it would mainly help once several agents use the board at once)

Loading, empty, success and error states are handled throughout, and the main
flows work on mobile and desktop.

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
tickets, and serves the API and the UI. Once it is up:

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
  application does not create tables on the fly.
- Sample data (tickets + the demo user) is inserted by `python -m app.seed`,
  which is idempotent and only adds the rows that are missing.
- With Docker, migrations and seeding run automatically on startup.

## Running the tests

The backend tests need a reachable Postgres server. They create the
`tickets_test` database themselves if it is not already there, so there is
nothing to set up beyond the server:

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

The brief asks for at least two meaningful tests. All five example areas it
lists are covered, across 16 backend tests and 4 frontend tests:

- [x] **Backend validation:** the API rejects a ticket without a title
- [x] **Ticket creation:** a valid ticket is stored and defaults to `open`
- [x] **Status update:** the `PATCH` endpoint saves the new status
- [x] **Form validation:** the create form shows errors for invalid input
- [x] **Data rendering:** the ticket list renders API data correctly

Both suites run in CI (GitHub Actions) on every push.

## API

REST, JSON in and out. The resource API is versioned under `/api/v1`.

| Method  | Path                    | Auth | Description |
| ------- | ----------------------- | :--: | ----------- |
| `POST`  | `/api/v1/auth/register` |      | Create an account, returns a token |
| `POST`  | `/api/v1/auth/login`    |      | Sign in, returns a token |
| `GET`   | `/api/v1/auth/me`       |  🔒  | The current user |
| `GET`   | `/api/v1/tickets`       |  🔒  | List tickets (`?status=`, `?priority=`, `?search=`, `?sort=`, `?limit=`, `?offset=`) |
| `GET`   | `/api/v1/tickets/{id}`  |  🔒  | Get one ticket |
| `POST`  | `/api/v1/tickets`       |  🔒  | Create a ticket (always starts `open`) |
| `PATCH` | `/api/v1/tickets/{id}`  |  🔒  | Update a ticket (primarily its status) |
| `POST`  | `/api/v1/tickets/reorder` | 🔒 | Reorder a board column and persist card positions |
| `GET`   | `/api/health`           |      | Liveness check |

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
  "position": 0,
  "createdAt": "2026-06-18T10:30:00Z",
  "updatedAt": "2026-06-18T10:30:00Z"
}
```

The list endpoint is paginated and returns the requested slice together with the
total count for the active filters:

```json
{
  "items": [ /* tickets */ ],
  "total": 14,
  "limit": 10,
  "offset": 0
}
```

`limit` defaults to 10 (max 100) and `offset` to 0. Statuses are `open`,
`in_progress`, `resolved`; priorities are `low`, `medium`, `high`. Validation
errors return `422`, a missing ticket returns `404`, and an empty update returns
`400`.

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
  it is documented, and versioning keeps the response contract free to evolve
  without breaking clients.
- **Extra `updated_at` field.** Beyond the required fields, tickets carry an
  `updated_at` timestamp (bumped on every change), which the details page shows
  as "last updated".
- **camelCase JSON, snake_case database.** The database columns are snake_case;
  the API speaks camelCase to read naturally in the TypeScript frontend. The two
  are mapped explicitly at the route boundary.
- **One `Ticket` table.** Customers are not modelled separately. Name and email
  live on the ticket, which is enough for this scope.
- **Filtering, search, sort and pagination run on the server.** The API applies
  them before counting and slicing, so the total stays accurate and the response
  stays small as the data grows, rather than shipping every ticket to the browser
  to filter there.
- **Board order is persisted.** The Kanban board stores a per-column `position`,
  so cards keep the exact order you drag them into and it survives a refresh. The
  main list keeps its own sorting (newest, oldest, or priority); position only
  drives the board.
- **Status updates happen on the details page** via an accessible select. The
  brief allows the control on the list or the details view; details keeps the list
  clean.
- **Authentication.** The dashboard is gated behind email/password login (JWT
  access tokens, bcrypt-hashed passwords). The brief lists auth as optional and
  defines no user model, but since this is **deployed live**, leaving it fully
  open-ended did not seem the right call, since anyone could create or modify
  tickets. Tickets are shared across all authenticated users (no per-user
  ownership), which keeps the single-dashboard model the brief describes.
- **Hand-written CSS** instead of a component library, to keep the bundle small
  and the styling easy to read.
- **Product framing.** The app is presented as a small product called "Helpdesk",
  with a matching logo and favicon, so the interface feels finished rather than
  like a bare exercise. This is purely cosmetic and changes none of the required
  behaviour.
- **Postgres over SQLite.** The brief accepts either. Postgres is the more
  production-realistic choice, and Docker Compose runs it so there is nothing to
  install locally.

## Further enhancements

- Per-user ticket ownership and roles. The current auth is shared-access.
- WebSocket live updates, which mainly pay off once several agents use the board
  concurrently.
- More frontend tests (details page and error paths) and an end-to-end test
  (Playwright).
