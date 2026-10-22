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
| K2 | `POST /api/reservations` | Done |
| K3 | Captured price × quantity, stored once | Done |
| K4 | `POST /api/reservations/<id>/payment` | Done |
| K5 | `GET /api/reservations` (own rows; all rows for admins) | Done |
| K6 | `PATCH`/`POST /api/reservations/<id>` | Done |
| K7 | `POST /api/reservations/<id>/cancellation` | Done |
| K8 | `POST /api/payments/<id>/refund` (admin) | Done |
| K9 | `POST /api/reservations/<id>/validation` (admin) | Done |
| K10 | `GET /api/reservations/<id>/history` | Done |
| K11 | Compensating `release`/`reserve` calls on failure | Done |
| Tests | 283 backend tests (unit + API) | Done |

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

## 4. Structure

```
kamal/
├── user/                 auth + profile, own .venv and run_tests.py
├── reservation/          reservations + history, own .venv and run_tests.py
├── payment/              payments + refunds, own .venv and run_tests.py
├── mock/                 mock flight, package and excursion services
├── requirements-dev.txt  pytest
├── run_all_tests.bat     runs the three local run_tests.py scripts
└── run_tests.py          cross-platform equivalent of the .bat
```

Each service has its own `.venv/` (git-ignored), created and installed separately.

Each service follows the same layout:

```
<service>/
├── .venv/                service virtual environment (git-ignored)
├── index.py              create_app(), error handlers, /health
├── config.py             environment values and defaults
├── requirements.txt
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
`travel_agency`. Docker is only used when explicitly requested.

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

Open one terminal per service:

```powershell
cd "C:\Users\kamal\Desktop\il\web service\project\code"
kamal\user\.venv\Scripts\python.exe kamal\user\index.py
kamal\reservation\.venv\Scripts\python.exe kamal\reservation\index.py
kamal\payment\.venv\Scripts\python.exe kamal\payment\index.py
```

Health checks: `/health` on ports **8083**, **8085** and **8086**.

### 5.5 Mock catalogue services

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
Stop with `Ctrl+C`.

## 6. Tests

The suites need no MySQL, no running service and no network: every test uses an in-memory
SQLite database and stubs the catalogue HTTP calls. Progress is shown as `[18/78]` because
each `pytest.ini` sets `console_output_style = count`.

```powershell
kamal\run_all_tests.bat
```

The `.bat` calls `run_tests.py` in each service folder. Each local script uses that service's
own `.venv` and starts the suite in a separate process, because all services use the same
top-level module names (`config`, `models`, `helpers`, `controls`). The same result is
available cross-platform with:

```powershell
py -3.11 kamal\run_tests.py
```

A single suite can be run from its service folder:

```powershell
cd kamal\user
py -3.11 run_tests.py
```

| Suite | Tests | Covers |
|-------|-------|--------|
| `user/tests` | 78 | Validators, PBKDF2/JWT helpers, register/login/logout/me/update-me, error envelopes |
| `reservation/tests` | 114 | Catalogue parsing, retry client, serializers, CRUD, cancellation, validation, history, permissions, stock compensation |
| `payment/tests` | 91 | Card validation, payment methods, declined cards, idempotency, refunds, permissions, compensation |

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
7. **Refunding a `CANCELLED` reservation releases the seats again** because cancellation
   already released them. Tracked in [`md/needs.md`](../md/needs.md).

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
