# OWASP ZAP — dynamic security scan

The security campaign supports both passive baseline spidering and full active/intrusive penetration scanning with fuzzing:

1. **Baseline scan (passive)**: Spiders the Angular frontend and analyzes passive rules (security headers, cookie flags, information disclosure, exposed assets).
2. **Active / Intrusive scan**: Performs intrusive attack payloads, SQLi/XSS/CSRF fuzzing, input validation attacks, and penetration testing rules against frontend and backend endpoints.
3. **API scan**: Runs active security assessments against RESTful endpoints.

## Run via Docker

Start the Docker stack first, then run:

```powershell
# Passive baseline scan
py quality/zap/run_zap.py

# Active / intrusive penetration scan (against frontend and services)
py quality/zap/run_zap.py --active

# Active scan with Ajax spider for Angular SPA
py quality/zap/run_zap.py --active --ajax --minutes 5

# Target specific backend API service directly
py quality/zap/run_zap.py --active --target http://host.docker.internal:8085
```

Docker is required; the image `ghcr.io/zaproxy/zaproxy:stable` is pulled automatically by Docker.

Reports are written to:

- `quality/reports/zap/zap-report.html` (baseline)
- `quality/reports/zap/zap-active-report.html` (active / intrusive)
- `quality/reports/zap/*.json` and `*.md`

## Options

| Option | Default | Purpose |
|--------|---------|---------|
| `--target` | `http://host.docker.internal:4200` | Target URL as seen from the ZAP container |
| `--mode` | `baseline` | `baseline` (passive), `active` (full attack), or `api` |
| `--active` | off | Shortcut for active / intrusive penetration scan |
| `--ajax` | off | Enables Ajax Spider for modern SPA navigation |
| `--minutes` | `2` | Spider time limit |
| `--fail-on-warn` | off | Fail the run on warnings (CI gate) |
| `--image` | `ghcr.io/zaproxy/zaproxy:stable` | ZAP image |
