# Reservation & Payment Services — Kamal

Working folder for Kamal. Git branch: **`kamal`**.
Use case: **`use_case_reservation`** · Tables: `users`, `sessions`, `reservations`, `payments`,
`reservation_history`.

> This folder holds the three Flask services. The shared documentation lives in
> [`md/`](../md/) and the shared MySQL infrastructure at the repository root.

## 1. Services

| Service | Port | Responsibility |
|---------|------|----------------|
| `user/` | **8083** | Registration, login/logout, JWT sessions, profile |
| `reservation/` | **8085** | Create, list, update, cancel, validate, history |
| `payment/` | **8086** | Pay, refund by reservation, refund by payment |

All three share the same `JWT_SECRET` and the same `sessions` table, so a token issued by
the user service is accepted by the reservation and payment services.

## 2. Delivered

| Task | Result | Status |
|------|--------|--------|
| K1 | Sign-up, login, logout, `GET`/`POST /api/auth/me` | Done |
| K2 | `POST /api/reservations` (past start dates rejected) | Done |
| K3 | Captured price × quantity, stored once | Done |
| K4 | `POST /api/reservations/<id>/payment` | Done |
| K5 | `GET /api/reservations` (own rows; admin search/status/type filters) | Done |
| K6 | `PATCH`/`POST /api/reservations/<id>` | Done |
| K7 | `POST /api/reservations/<id>/cancellation` | Done |
| K8 | `POST /api/payments/<id>/refund` (admin) | Done |
| K9 | `POST /api/reservations/<id>/validation` (admin) | Done |
| K10 | `GET /api/reservations/<id>/history` | Done |
| K11 | Compensating `release`/`reserve` calls on failure | Done |
| Tests | 311 backend tests (unit + API) | Done |

## 3. API

Authentication uses `Authorization: Bearer <jeton>`.

### User service — `http://localhost:8083`

| Method | Path | Access |
|--------|------|--------|
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/logout` | Authenticated |
| `GET` | `/api/auth/me` | Authenticated |
| `POST` | `/api/auth/me` | Authenticated |
| `GET` | `/health` | Public |

### Reservation service — `http://localhost:8085`

| Method | Path | Access |
|--------|------|--------|
| `GET` | `/api/reservations` | Authenticated |
| `POST` | `/api/reservations` | Authenticated |
| `GET` | `/api/reservations/<id>` | Owner or admin |
| `PATCH` / `POST` | `/api/reservations/<id>` | Owner or admin |
| `POST` | `/api/reservations/<id>/cancellation` | Owner or admin |
| `POST` | `/api/reservations/<id>/validation` | Admin |
| `GET` | `/api/reservations/<id>/history` | Owner or admin |
| `GET` | `/health` | Public |

`GET /api/reservations` accepts `search` (reference or item label), `status` and `typeItem`
filters; clients still only see their own rows.

### Payment service — `http://localhost:8086`

| Method | Path | Access |
|--------|------|--------|
| `POST` | `/api/reservations/<id>/payment` | Owner or admin |
| `POST` | `/api/reservations/<id>/refund` | Admin |
| `POST` | `/api/payments/<id>/refund` | Admin |
| `GET` | `/health` | Public |

Responses use one of two envelopes:

```json
{ "data": { } }
```

```json
{ "error": { "code": "INVALID_FORMAT", "message": "...", "details": { } } }
```

Notes the code makes that the tables above do not show:

- `POST /api/auth/register` answers **`201`** with the full session envelope
  (`{ jeton, expiration, user }`), not just a user; `409 DUPLICATE` when the email exists and
  `400 INVALID_FORMAT` when the password is shorter than 8 characters.
- `POST /api/auth/logout` answers `{ "data": { "success": true } }`; `GET /api/auth/me`
  answers the user object, `POST /api/auth/me` the session envelope.
- `/health` is **not** enveloped on the user service (`{ "status": "ok" }`) while the other two
  answer `{ "data": { "service": "…", "status": "ok", "port": … } }`.
- `GET /api/reservations` answers a bare array (max 100 rows, no pagination), `PATCH` **and**
  `POST /api/reservations/<id>` both update the quantity, and the refund route used by the
  frontend is `POST /api/reservations/<id>/refund` (the `/api/payments/<id>/refund` variant also
  exists).

## 4. Structure

```
kamal/
├── user/                 auth + profile, own .venv and run_tests.py
├── reservation/          reservations + history, own .venv and run_tests.py
├── payment/              payments + refunds, own .venv and run_tests.py
├── docker-compose.yml    the three services in Docker (MySQL stays at the root)
├── .env.example          values read by docker-compose.yml (→ .env)
├── mock/                 mock flight, package and excursion services
├── requirements-dev.txt  pytest
├── run.bat               starts the mocks, the three services and the Angular dev server
└── run_all_tests.bat     runs the three local run_tests.py scripts
```

There is **no `kamal/run_tests.py` at the root**: the cross-platform entry point is
`run_all_tests.bat`, and each service folder has its own `run_tests.py`.

Each service has its own `.venv/` (git-ignored), created and installed separately.

Each service follows the same layout:

```
<service>/
├── .venv/                service virtual environment (git-ignored)
├── index.py              create_app(), error handlers, /health
├── config.py             environment values and defaults
├── requirements.txt
├── Dockerfile
├── .dockerignore
├── .env.example
├── pytest.ini
├── run_tests.py          runs this service's suite with its .venv
├── controls/             Flask blueprints
├── helpers/              auth, security, responses, HTTP clients
├── models/               SQLAlchemy models
└── tests/
    ├── conftest.py       in-memory SQLite + auth fixtures
    ├── unit/             pure helpers
    └── api/              Flask test client endpoints
```

## 5. Setup

### 5.1 Python environments

Each service owns its virtual environment, so it can be installed, started and packaged on
its own:

```powershell
cd "C:\Users\kamal\Desktop\il\web service\project\code"
py -3.11 -m venv kamal\user\.venv
py -3.11 -m venv kamal\reservation\.venv
py -3.11 -m venv kamal\payment\.venv
kamal\user\.venv\Scripts\python.exe -m pip install -r kamal\user\requirements.txt -r kamal\requirements-dev.txt
kamal\reservation\.venv\Scripts\python.exe -m pip install -r kamal\reservation\requirements.txt -r kamal\requirements-dev.txt
kamal\payment\.venv\Scripts\python.exe -m pip install -r kamal\payment\requirements.txt -r kamal\requirements-dev.txt
```

### 5.2 Database

Apply the shared schema once, in order:

1. `db/init/10-auth.sql`
2. `db/init/50-reservation.sql`
3. `db/init/90-seed.sql`

The local MySQL instance is expected on `127.0.0.1:3306` with database
`travel_agency`. Docker is only used when explicitly requested. The code default for
`DB_PORT` is **3307** (the Compose published port), so `DB_PORT=3306` must be set in every
`.env` for the local instance.

### 5.3 Environment files

Copy each `.env.example` to `.env` in the same folder and change the secrets:

- `kamal/user/.env.example` → `kamal/user/.env`
- `kamal/reservation/.env.example` → `kamal/reservation/.env`
- `kamal/payment/.env.example` → `kamal/payment/.env`

Rules:

- `JWT_SECRET` must be **identical** in all three files.
- `SECRET_KEY`, `JWT_SECRET` and `DB_PASSWORD` have no defaults; the service refuses to start
  without them.
- `DB_HOST=127.0.0.1`, `DB_PORT=3306` for local MySQL.
- `CORS_ORIGINS=http://localhost:4200` for the Angular dev server.
- `.env` files are git-ignored and must never be committed.

### 5.4 Start the services

The launcher opens one window for the mocks and one per service:

```powershell
kamal\run.bat
```

Or start them manually, one terminal per process:

```powershell
cd "C:\Users\kamal\Desktop\il\web service\project\code"
kamal\user\.venv\Scripts\python.exe kamal\user\index.py
kamal\reservation\.venv\Scripts\python.exe kamal\reservation\index.py
kamal\payment\.venv\Scripts\python.exe kamal\payment\index.py
```

Health checks: `/health` on ports **8083**, **8085** and **8086**.

### 5.5 Run the three services in Docker

The three services are containerised: one `Dockerfile` per service and one
`kamal/docker-compose.yml`. The database is **not** redefined there — it stays the shared
MySQL container of the repository root.

1. Start the shared infrastructure once, at the repository root:

```bash
docker compose up -d
```

2. Create the Compose environment file (it holds the shared secrets):

```bash
cp kamal/.env.example kamal/.env
```

3. Build and start the three services:

```bash
docker compose -f kamal/docker-compose.yml up -d --build
docker compose -f kamal/docker-compose.yml ps        # all three must report "healthy"
docker compose -f kamal/docker-compose.yml logs -f    # follow the logs
```

| Container | Image | Host port |
|-----------|-------|-----------|
| `travel-agency-kamal-user-service-1` | `kamal-user-service` | 8083 |
| `travel-agency-kamal-reservation-service-1` | `kamal-reservation-service` | 8085 |
| `travel-agency-kamal-payment-service-1` | `kamal-payment-service` | 8086 |

Health checks: `curl http://localhost:8083/health`, `http://localhost:8085/health` and
`http://localhost:8086/health`. The stack joins the `travel_agency_net` network, so the
containers reach MySQL as `mysql` (`DB_HOST=mysql`, port 3306) — never `127.0.0.1`.

Stop it with `docker compose -f kamal/docker-compose.yml down`; the images and the database
are kept. A rebuild is only needed after a code change:
`docker compose -f kamal/docker-compose.yml up -d --build`.

The catalogue services (flight 8081, package 8082, excursion 8084) are **not** containerised:
the reservation and payment containers reach the mocks running on the host through
`host.docker.internal`, already configured in `kamal/docker-compose.yml`. Start them with
`py -3.11 kamal/mock/run_all.py`; without them, `POST /api/reservations` answers
`502 SERVICE_UNAVAILABLE`.

Notes:

- `.env` files are excluded from the images (`.dockerignore`); every value comes from
  `kamal/.env` through Compose.
- The containers run `gunicorn` as a non-root user, and each Dockerfile carries a
  `HEALTHCHECK` on `/health`.
- `kamal/.env` must never be committed (it is already covered by `.gitignore`).

### 5.6 Mock catalogue services

The flight, package and excursion services are not implemented yet. Their mocks live in
`kamal/mock/` and listen on the real ports, so the `.env` URLs need no change:

```powershell
py -3.11 kamal\mock\run_all.py
```

One mock can also run alone:

```powershell
py -3.11 kamal\mock\flight\index.py      # 8081
py -3.11 kamal\mock\package\index.py     # 8082
py -3.11 kamal\mock\excursion\index.py   # 8084
```

Each mock exposes `GET /health`, `GET /__calls`, `POST /__reset` and
`POST /__scenario` with `ok`, `missing`, `broken`, `slow`, `full`, `inactive` or `garbage`.
Stop with `Ctrl+C`. A browser tab that reloads or navigates away mid-response is ignored instead
of printing a `ConnectionAbortedError` traceback.

The list endpoints honour the contract filters: `search`, `departureCity`, `arrivalCity`,
`departureDate`, `arrivalDate`, `airline`, `minPrice`, `maxPrice` and `minSeats` for flights;
`search`, `destination`, `startDate` and price filters for packages; `search`, `location`, `date`,
`fromDate`, `toDate`, `maxDuration` and price filters for excursions. Flight payloads expose
`departureTime`/`arrivalTime`; the `departureDate`/`arrivalDate` query parameters filter those fields.

## 6. Tests

The suites need no MySQL, no running service and no network: every test uses an in-memory
SQLite database and stubs the catalogue HTTP calls. Progress is shown as `[18/78]` because
each `pytest.ini` sets `console_output_style = count`.

```powershell
kamal\run_all_tests.bat
```

The `.bat` calls `run_tests.py` in each service folder. Each local script uses that service's
own `.venv` and starts the suite in a separate process, because all services use the same
top-level module names (`config`, `models`, `helpers`, `controls`). There is no root
`run_tests.py`; run each suite directly instead (one process per service). The mock helper
tests are separate and need an interpreter with `pytest` (any service venv works):

```powershell
kamal\reservation\.venv\Scripts\python.exe -m pytest kamal\mock\tests -q   # 6 tests
```

A single suite can be run from its service folder:

```powershell
cd kamal\user
py -3.11 run_tests.py
```

| Suite | Tests | Covers |
|-------|-------|--------|
| `user/tests` | 78 | Validators, PBKDF2/JWT helpers, register/login/logout/me/update-me, error envelopes |
| `reservation/tests` | 142 | Catalogue parsing, retry client, serializers, CRUD, list filters, booking/cancellation rules, validation, history, permissions, stock compensation |
| `payment/tests` | 91 | Card validation, payment methods, declined cards, idempotency, refunds, permissions, compensation |
| `mock/tests` | 6 | Shared scenario / filter helpers of the mock catalogue |

Total: **311** service tests + 6 mock tests.

## 7. Watch-outs

1. **Never write to `flights`, `packages` or `excursions`.** Those tables belong to Mohammed,
   Youssef and Marwan.
2. **Call the neighbouring services, not their tables.** See
   [`md/05-rest-api-contract.md`](../md/05-rest-api-contract.md) § 2, 3 and 4.
3. **A 3 s timeout and at most 2 attempts** on every inter-service call.
4. **No bank card data** in the database or logs. Only the last 4 digits and a transaction
   reference are stored.
5. **The price is captured** in `unit_price` when the reservation is created.
6. **The reservation owner is read from the token**, never from the request body.
7. **Booking stops once the item's start date has passed**, but same-day bookings are still
   accepted. The check uses the date captured from the catalogue and returns
   `422 BUSINESS_RULE_VIOLATION`.
8. **A refund releases the seats exactly once.** Cancelling a `PAID` booking does not release
   (the money has not moved), the refund does; cancelling a `PENDING`/`CONFIRMED` booking
   releases immediately and leaves no successful payment to refund. Details in
   [`md/07`](../md/07-sequence-reservation-payment.md) § 3.

## 8. Demo data and test cards

Demo accounts from the seed dataset:

- `client@agency.travel` / `Password123!`
- `admin@agency.travel` / `Password123!`

Payment simulation:

- `4242424242424242`, expiry `12/28`, CVV `123` → success.
- `4000000000000002`, expiry `12/28`, CVV `123` → `402 PAYMENT_DECLINED`.

## 9. References

| Need | Document |
|------|----------|
| My mission and the others | [`md/02-tasks-and-ownership.md`](../md/02-tasks-and-ownership.md) |
| Data model | [`md/04-data-model.md`](../md/04-data-model.md) |
| API contract | [`md/05-rest-api-contract.md`](../md/05-rest-api-contract.md) |
| Reservation / payment / cancellation scenarios | [`md/07-sequence-reservation-payment.md`](../md/07-sequence-reservation-payment.md) |
| Local machine setup | [`md/kamal.md`](../md/kamal.md) |
