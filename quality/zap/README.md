# OWASP ZAP — dynamic security scan

The baseline scan spiders the Angular frontend and runs ZAP's passive rules:
security headers, cookie flags, information disclosure, exposed files and
similar issues. It does not perform destructive active attacks.

## Run

Start the frontend (and the API stack if the scanned pages call it), then:

```powershell
py -3.11 quality/zap/run_zap.py
```

Docker is required; the image `ghcr.io/zaproxy/zaproxy:stable` is pulled on
first run. Reports are written to:

- `quality/reports/zap/zap-report.html`
- `quality/reports/zap/zap-report.json`
- `quality/reports/zap/zap-report.md`

## Options

| Option | Default | Purpose |
|--------|---------|---------|
| `--target` | `http://host.docker.internal:4200` | URL as seen from the container |
| `--minutes` | `2` | Spider time limit |
| `--fail-on-warn` | off | Fail the run on warnings (CI gate) |
| `--image` | `ghcr.io/zaproxy/zaproxy:stable` | ZAP image |

`host.docker.internal` resolves to the host from Docker Desktop. On Linux use
`--target http://localhost:4200 --add-host` or run with `--network host`.

## Scope and limits

- The baseline scan is unauthenticated: it sees public pages only. Authenticated
  booking/admin screens are covered by the Selenium suite.
- `zap-baseline.conf` tunes rule actions; keep findings visible unless a rule is
  a documented false positive.
- Do not point the active scan at production. This campaign targets the local
  Docker stack.
