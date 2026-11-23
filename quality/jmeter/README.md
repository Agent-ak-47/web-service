# JMeter — load, saturation, and chaos testing

The JMeter campaign exercises the services under nominal conditions, stress/breaking loads, extreme concurrency race conditions, and negative fault injection.

## Test Plans

1. **`atlas-trips.jmx` (Nominal Profile)**:
   - Catalogue browsing across flights, packages, excursions (5 users, 3 loops).
   - End-to-end client booking and payment flow (3 users, 2 loops).
   - Admin reservations inspection.

2. **`atlas-trips-stress-chaos.jmx` (Stress, Saturation & Chaos)**:
   - **01 - Saturation and Breaking Load**: 50 concurrent threads bursting catalog queries to identify throughput saturation and latency degradation.
   - **02 - Extreme Concurrency Race Condition**: 25 concurrent threads attempting to book the exact same limited flight inventory simultaneously using a Synchronizing Timer to verify transactional integrity and overbooking prevention.
   - **03 - Fault Tolerance and Chaos**: Negative input injection (malformed payloads, negative IDs, expired tokens, corrupt payment formats) ensuring services reject invalid requests cleanly with 4xx rather than crashing with 500s.

## Run via Docker or Local JMeter

No local JMeter installation is required; if JMeter is not on PATH, the runner automatically uses the standard Docker image `justb4/jmeter:5.5`.

Start the Docker stack first, then run:

```powershell
# Run nominal profile (Docker auto-detected)
py quality/jmeter/run_jmeter.py

# Run stress, saturation and chaos profile
py quality/jmeter/run_jmeter.py --chaos

# Run both profiles
py quality/jmeter/run_jmeter.py --plan all

# Force Docker execution explicitly
py quality/jmeter/run_jmeter.py --docker --chaos
```

HTML dashboards are generated at:

- `quality/reports/jmeter/nominal/html/index.html`
- `quality/reports/jmeter/chaos/html/index.html`
