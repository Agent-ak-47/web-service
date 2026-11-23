# Software quality campaign

This directory contains the tooling required by `res/Outils Qualité logicielle.pdf`.
Every tool writes its artifacts under `quality/reports/`.

| Tool | Scope | Command | Artifact |
|------|-------|---------|----------|
| Pytest + Coverage.py | Flask services (`kamal/user`, `reservation`, `payment`) | `py quality/coverage/run_coverage.py --python` | `reports/coverage/python-*.xml`, HTML |
| Istanbul (Vitest) | Angular frontend | `py quality/coverage/run_coverage.py --frontend` | `reports/coverage/frontend-lcov.info` |
| Istanbul (c8) | Node services (`marwan`, `mohammed`) | `py quality/coverage/run_coverage.py --node` | `reports/coverage/node-*/lcov.info` |
| JUnit + JaCoCo | `package-service` (Spring Boot, JDK 25 via Docker) | `py quality/coverage/run_coverage.py --java` | `package-service/target/site/jacoco/` |
| Checkstyle | `package-service` | same Maven run | `package-service/target/checkstyle-result.xml` |
| Postman / Newman | REST API of the six services | `py quality/postman/run_newman.py` | `reports/postman/newman-report.json` |
| JMeter (Nominal) | Load and nominal performance | `py quality/jmeter/run_jmeter.py` | `reports/jmeter/nominal/html/index.html` |
| JMeter (Stress & Chaos) | Saturation, extreme concurrency, chaos checks | `py quality/jmeter/run_jmeter.py --chaos` | `reports/jmeter/chaos/html/index.html` |
| Selenium | Angular end-to-end UI | `py quality/selenium/run_selenium.py` | `reports/selenium/report.html` |
| OWASP ZAP (Baseline) | Dynamic security (passive spider) | `py quality/zap/run_zap.py` | `reports/zap/zap-report.html` |
| OWASP ZAP (Active / Intrusive) | Active attack scan & fuzzing | `py quality/zap/run_zap.py --active` | `reports/zap/zap-active-report.html` |
| Snyk | Dependency and code security | `py quality/snyk/run_snyk.py` | `reports/snyk/*.json` |
| SonarQube | Static analysis and quality gate | `py quality/sonar/run_sonar.py` | SonarQube dashboard |

## Prerequisites

- Python (`py`) and the service virtual environments.
- Node.js 20+ and `npm ci` in `frontend`, `marwan/backend`, `mohammed/backend`.
- Docker Desktop (handles ZAP, JMeter container, JDK 25 Maven runner, and SonarQube).
- Newman (`npm install -g newman`) for Postman.
- Snyk CLI (`npm install -g snyk`) and `snyk auth`.
- `SONAR_TOKEN` for SonarQube.

Install the quality Python helpers:

```powershell
py -m pip install -r quality/requirements.txt
```

## Quick start

```powershell
# Coverage for Python, Node, frontend, and Java (package-service runs in JDK 25 Docker container)
py quality/coverage/run_coverage.py --all

# API, UI and load tests (the stack must be running)
py quality/postman/run_newman.py
py quality/selenium/run_selenium.py
py quality/jmeter/run_jmeter.py --plan all

# Security (passive baseline + active intrusive scan)
py quality/zap/run_zap.py --active
py quality/snyk/run_snyk.py

# Static analysis
$env:SONAR_TOKEN = "<token>"
py quality/sonar/run_sonar.py
```

Or run a group via `run_all.py`:

```powershell
py quality/run_all.py --coverage
py quality/run_all.py --dynamic
py quality/run_all.py --security
py quality/run_all.py --all
```

## Reports

`quality/reports/` is generated and git-ignored. Keep the XML/JSON summaries
needed for the report and regenerate the HTML dashboards on demand.
