# Snyk — dependency and code security

Snyk checks the Maven, npm and Python dependency trees plus the source code for
known vulnerabilities and insecure patterns.

## Setup

```powershell
npm install -g snyk
snyk auth
```

`run_snyk.py` never stores a token; authentication stays in the local Snyk
configuration.

## Run

```powershell
py -3.11 quality/snyk/run_snyk.py
py -3.11 quality/snyk/run_snyk.py --severity high
py -3.11 quality/snyk/run_snyk.py --skip-code
```

Reports:

- `quality/reports/snyk/snyk-open-source.json` — dependencies (`snyk test --all-projects`)
- `quality/reports/snyk/snyk-code.json` — SAST (`snyk code test`)
- `quality/reports/snyk/summary.json` — projects and failed scans

Snyk exit codes: `0` no issue, `1` vulnerabilities found, `2` scan failure. The
runner reports `2` only when a scan itself fails; vulnerabilities remain visible
in the JSON reports.

## Policy

`.snyk` at the repository root excludes generated reports, `node_modules` and
`.venv` from the scan scope. Do not add ignores for real vulnerabilities; fix or
document them in `md/sec_issues.md`.
