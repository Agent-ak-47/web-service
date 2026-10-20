# Reservation & Payment Service — Kamal

Working folder for Kamal. Git branch: **`kamal`**.
Use case: **`use_case_reservation`** · Tables: `users`, `sessions`, `reservations`, `payments`, `reservation_history`.

> This folder holds **only the service code**. The shared documentation lives in
> [`md/`](../md/) and the shared MySQL infrastructure at the repository root.

## 1. Already delivered

| Deliverable | Location | Status |
|-------------|----------|--------|
| Full documentation (UML, ERD, API, sequence, Docker, Git) | `md/` | ✅ |
| Shared MySQL service (single `travel_agency` database) | `docker-compose.yml`, `db/init/` | ✅ |
| Auth SQL schema | `db/init/10-auth.sql` | ✅ |
| Reservation + Payment SQL schema | `db/init/50-reservation.sql` | ✅ |
| Demo dataset | `db/init/90-seed.sql` | ✅ |

## 2. Still to do

| # | Task | Expected result |
|---|------|-----------------|
| K1 | Sign-up / authentication / token | `POST /api/auth/register`, `/login`, `/deconnexion`, `GET /api/auth/me` |
| K2 | Create a reservation | `POST /api/reservations` |
| K3 | `calculateTotal()` | captured price × quantity, never recomputed afterwards |
| K4 | Online payment | `POST /api/reservations/{id}/payment` |
| K5 | View own reservations | `GET /api/reservations` |
| K6 | Update a reservation | `PATCH /api/reservations/{id}` |
| K7 | Cancel (seat released) | `POST /api/reservations/{id}/cancellation` |
| K8 | Refund (admin) | `POST /api/payments/{id}/refund` |
| K9 | Validate (admin) | `POST /api/reservations/{id}/validation` |
| K10 | Tracking / history | `GET /api/reservations/{id}/history` |
| K11 | Compensation on failure | `/release` call to the owning service |
| — | Dockerfile + tests | `docker build` passes, ≥ 3 tests per use case |

## 3. Expected service structure

To be created as work progresses, mirroring the layout of the other members:

```
kamal/
├── Dockerfile
├── .dockerignore
├── package.json            (or pom.xml / requirements.txt)
├── .env.example            # values WITHOUT secrets
└── src/
    ├── server.js           # startup, middlewares, routes
    ├── config.js           # reads process.env, nothing hard-coded
    ├── db/
    │   ├── pool.js         # connection pool to travel_agency
    │   └── migrations/
    ├── modules/
    │   ├── auth/           # K1
    │   │   ├── auth.routes.js
    │   │   ├── auth.service.js
    │   │   └── auth.controller.js
    │   └── reservation/    # K2 to K11
    │       ├── reservation.routes.js
    │       ├── reservation.service.js
    │       └── reservation.controller.js
    ├── clients/            # HTTP clients to the other services
    │   ├── flight.client.js
    │   ├── package.client.js
    │   └── excursion.client.js
    └── middlewares/        # authentication, ADMIN role, error handling
```

## 4. Watch-outs

1. **Never write to `flights`, `packages` or `excursions`.**
   The database is shared, so nothing stops you technically — it is a rule, not a
   permission. Those tables belong to Mohammed, Youssef and Marwan.
2. **Call the neighbouring services, not their tables.** See
   [`md/05-rest-api-contract.md`](../md/05-rest-api-contract.md) § 2, 3 and 4.
3. **A 3 s timeout and at most 2 attempts** on every inter-service call.
4. **No bank card data** in the database or in the logs.
5. **The price is captured** in `unit_price` when the reservation is created.
6. **The reservation owner is read from the token**, never from the request body.

## 5. Startup

```bash
# At the repository root: the shared database
docker compose up -d
docker compose ps        # mysql must report "healthy"

# Demo accounts
#   client@agency.travel / Password123!
#   admin@agency.travel  / Password123!
```

## 6. References

| Need | Document |
|------|----------|
| My mission and the others | [`md/02-tasks-and-ownership.md`](../md/02-tasks-and-ownership.md) |
| Data model | [`md/04-data-model.md`](../md/04-data-model.md) |
| Endpoints to implement | [`md/05-rest-api-contract.md`](../md/05-rest-api-contract.md) |
| Reservation / payment / cancellation scenarios | [`md/07-sequence-reservation-payment.md`](../md/07-sequence-reservation-payment.md) |