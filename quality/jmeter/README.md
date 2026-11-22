# JMeter — load and performance testing

`atlas-trips.jmx` exercises the three catalogues, the client booking/payment
path and the admin reservation list. It asserts the JSON envelope and the
expected business values (`PENDING`, `SUCCEEDED`, `jeton`).

## Run

Start the stack first (`docker compose up -d` in `kamal/`), then:

```powershell
py -3.11 quality/jmeter/run_jmeter.py --jmeter "C:\JMeter\apache-jmeter-5.6.3\bin\jmeter.bat"
```

The runner removes the previous output, executes the plan in non-GUI mode and
writes an HTML dashboard to `quality/reports/jmeter/html/index.html`.

## Plan

| Thread group | Users | Loops | Flow |
|--------------|-------|-------|------|
| 01 - Browse catalogue | 5 | 3 | flights, packages, excursions |
| 02 - Client booking and payment | 3 | 2 | login, reserve flight 5, pay, list |
| 03 - Admin dashboard | 1 | 2 | admin login, list all reservations |

Variables (host, ports, demo accounts) live in the Test Plan. The host can be
overridden with `-Jhost=value` or the runner's `--host` option.

> Load tests create real reservations and payments. Run them against a disposable
> database or reset the seed afterwards.
