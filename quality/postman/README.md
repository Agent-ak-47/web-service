# Postman — API testing

The collection covers the six services: authentication, the three catalogues,
reservations, payments and health checks. It creates its own QA catalogue rows and
cleans them up at the end.

## Import

1. Open Postman.
2. Import `ATLAS-TRIPS.postman_collection.json`.
3. Import `ATLAS-TRIPS.postman_environment.json`.
4. Select the **ATLAS TRIPS - local** environment.

## Run

Start the stack first (`docker compose up -d` in `kamal/`), then either use
**Collection → Run** in Postman or:

```powershell
npm install -g newman
py -3.11 quality/postman/run_newman.py
```

The JSON report is written to `quality/reports/postman/newman-report.json`.

## Variables

| Variable | Default | Used by |
|----------|---------|---------|
| `userUrl` | `http://localhost:8083` | auth |
| `flightUrl` | `http://localhost:8081` | flights |
| `packageUrl` | `http://localhost:8082` | packages |
| `excursionUrl` | `http://localhost:8084` | excursions |
| `reservationUrl` | `http://localhost:8085` | reservations |
| `paymentUrl` | `http://localhost:8086` | payments |
| `clientEmail` / `clientPassword` | demo client | login |
| `adminEmail` / `adminPassword` | demo admin | admin routes |

Tokens and created ids are stored in collection variables during the run.
