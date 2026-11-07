# Excursion Service — Marwan

Working folder for **Marwan**. Git branch: **`marwan`** · Use case: **`use_case_excursion`**
· Tables: `excursions`, `excursion_capacity_movements` (already defined in
[`db/init/30-excursion.sql`](../db/init/30-excursion.sql)).

This folder contains the **Node.js/Express** backend (port **8084**) for the excursion
catalogue. The frontend is the shared **Angular** app at the repository root (`frontend/`),
which already contains the excursion pages. The backend speaks the exact REST contract of the
other members, so the Reservation service (Kamal) can book an excursion exactly like a flight
or a package.

## 1. What it does

| # | Task | Endpoint |
|---|------|----------|
| R1 | CRUD for excursions | `GET/POST/PUT/DELETE /api/excursions` |
| R2 | Search by location / date | `GET /api/excursions?location=…&date=…` |
| R3 | Excursion details | `GET /api/excursions/{id}` |
| R4 | Capacity check | `GET /api/excursions/{id}/availability` |
| R5 | Book / release a seat | `POST /api/internal/excursions/{id}/reserve` · `…/release` |
| R6 | Capacity journal | table `excursion_capacity_movements` |

The `/availability`, `/reserve`, `/release` trio uses the same status-code convention as the
Flight and Package services (`200`, `409 INSUFFICIENT_AVAILABILITY`, `404`), which is what lets
the Reservation service handle all three catalogue types generically.

## 2. Structure

```
marwan/
├── backend/               Node.js + Express service (port 8084)
│   ├── src/
│   │   ├── server.js       entry point
│   │   ├── app.js          createApp(): CORS, routes, error handler
│   │   ├── config.js       environment values
│   │   ├── db.js           mysql2 connection pool (shared travel_agency)
│   │   ├── middleware/     auth.js (JWT role ADMIN)
│   │   ├── controllers/    request parsing + validation
│   │   ├── services/       SQL, reserve/release transactions + journal
│   │   ├── routes/         /api/excursions + /api/internal/excursions
│   │   └── utils/          response, serialize, validate, asyncHandler
│   ├── tests/              node:test unit tests (validate + serialize)
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml      the service in Docker (MySQL stays at the repo root)
└── .env.example            values read by docker-compose.yml (→ .env)
```

## 3. Database

The tables are shared with the other members and owned by Marwan. **Do not read or write the
`flights`, `packages`, `users`, `reservations`, `payments` or `sessions` tables** — those belong
to Mohammed / Youssef / Kamal. This service only touches:

- `excursions` — the catalogue.
- `excursion_capacity_movements` — journal of every reservation / release / admin change.

They are created by `db/init/30-excursion.sql` (runs on `docker compose up -d` at the repo root)
and seeded by `db/init/90-seed.sql` (3 demo excursions).

## 4. Backend

### 4.1 Run locally

```bash
cd marwan/backend
cp .env.example .env          # then edit DB_HOST / DB_PORT / JWT_SECRET
npm install
npm start                     # http://localhost:8084
```

- From the workstation: `DB_HOST=127.0.0.1`, `DB_PORT=3307` (the Compose published port).
- `JWT_SECRET` must match the Auth / Reservation services (Kamal), otherwise admin tokens are
  rejected.

Health check: `curl http://localhost:8084/health`.

### 4.2 Run in Docker

```bash
# 1. shared infrastructure (MySQL) at the repo root
docker compose up -d

# 2. this service
cp marwan/.env.example marwan/.env
docker compose -f marwan/docker-compose.yml up -d --build
docker compose -f marwan/docker-compose.yml ps      # must report "healthy"
```

Inside Docker the backend reaches MySQL as `mysql` (`DB_HOST=mysql`, port `3306`).

### 4.3 Endpoints

| Method | Route | Access |
|--------|-------|--------|
| `GET` | `/api/excursions` | public |
| `GET` | `/api/excursions/{id}` | public |
| `GET` | `/api/excursions/{id}/availability` | public |
| `POST` | `/api/excursions` | admin |
| `PUT` | `/api/excursions/{id}` | admin |
| `POST` | `/api/excursions/{id}` | admin (the frontend updates with POST) |
| `DELETE` | `/api/excursions/{id}` | admin |
| `POST` | `/api/internal/excursions/{id}/reserve` | internal `{quantity, reservationId}` |
| `POST` | `/api/internal/excursions/{id}/release` | internal |
| `GET` | `/health` | public |

Filters on `GET /api/excursions`: `search` (title/location/guide), `location`, `date`,
`fromDate`, `toDate`, `minPrice`, `maxPrice`, `maxDuration`, `sortBy` (`price|date|title|location|durationMinutes`),
`order` (`asc|desc`).

Responses use the shared envelopes:

```json
{ "data": { … } }
{ "error": { "code": "NOT_FOUND", "message": "…", "details": { } } }
```

### 4.4 Tests

```bash
cd marwan/backend
npm test                       # node --test (unit tests, no DB needed)
```

## 5. Frontend (Angular)

The frontend is the shared Angular app at the repository root (`frontend/`). Its excursion
pages already point to this service (`EXCURSION_SERVICE_URL = http://localhost:8084`):

- **Browse**: `/excursions` (search by location / date / max price) and `/excursions/:id`.
- **Admin**: `/admin/excursions` (list + delete) and `/admin/excursions/form` (create/edit).

Start it from the repository root:

```bash
cd frontend
npm install
npm start                      # http://localhost:4200
```

Set `MOCK_MODE = false` in `frontend/src/services/global.service.ts` to talk to the real
backend (it defaults to the mock data otherwise).

## 6. Watch-outs

1. **Only write to `excursions` and `excursion_capacity_movements`.**
2. **Answer camelCase JSON** and map the contract columns: `duration_minutes` → `dureeMinutes`,
   `available_places` → `availableSeats`, `active` → `available`, `image_url` → `imageUrl`.
3. **The admin form sends numeric fields as strings** — the backend casts them (see
   `utils/validate.js`), accepts an empty `imageUrl`, and accepts `active` while answering
   `available`.
4. **Reserve / release are atomic** (a single InnoDB transaction with `SELECT … FOR UPDATE` +
   a journal row), so a double-booking is impossible.
5. **Never touch another member's tables** — reading a flight or package happens through their
   REST API, never a SQL `SELECT`.
