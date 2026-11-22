# Software quality campaign

This directory contains the tooling required by `res/Outils Qualité logicielle.pdf`.
Every tool writes its artifacts under `quality/reports/`.

| Tool | Scope | Command | Artifact |
|------|-------|---------|----------|
| Pytest + Coverage.py | Flask services (`kamal/user`, `reservation`, `payment`) | `py -3.11 quality/coverage/run_coverage.py --python` | `reports/coverage/python-*.xml`, HTML |
| Istanbul (Vitest) | Angular frontend | `py -3.11 quality/coverage/run_coverage.py --frontend` | `reports/coverage/frontend-lcov.info` |
| Istanbul (c8) | Node services (`marwan`, `mohammed`) | `py -3.11 quality/coverage/run_coverage.py --node` | `reports/coverage/node-*/lcov.info` |
| JUnit + JaCoCo | `package-service` (Spring Boot) | `py -3.11 quality/coverage/run_coverage.py --java` | `package-service/target/site/jacoco/` |
| Checkstyle | `package-service` | same Maven run | `package-service/target/checkstyle-result.xml` |
| Postman / Newman | REST API of the six services | `py -3.11 quality/postman/run_newman.py` | `reports/postman/newman-report.json` |
| JMeter | Load and performance | `py -3.11 quality/jmeter/run_jmeter.py` | `reports/jmeter/html/index.html` |
| Selenium | Angular end-to-end UI | `py -3.11 quality/selenium/run_selenium.py` | `reports/selenium/report.html` |
| OWASP ZAP | Dynamic security (baseline) | `py -3.11 quality/zap/run_zap.py` | `reports/zap/zap-report.html` |
| Snyk | Dependency and code security | `py -3.11 quality/snyk/run_snyk.py` | `reports/snyk/*.json` |
| SonarQube | Static analysis and quality gate | `py -3.11 quality/sonar/run_sonar.py` | SonarQube dashboard |

## Prerequisites

- Python 3.11 (`py -3.11`) and the service virtual environments.
- Node.js 20+ and `npm ci` in `frontend`, `marwan/backend`, `mohammed/backend`.
- JDK 25 and Maven for `package-service` (the POM targets Java 25).
- Docker Desktop for SonarQube and ZAP.
- Newman (`npm install -g newman`) for Postman.
- JMeter 5.6+ for the performance plan.
- Snyk CLI (`npm install -g snyk`) and `snyk auth`.
- `SONAR_TOKEN` for SonarQube.

Install the quality Python helpers:

```powershell
py -3.11 -m pip install -r quality/requirements.txt
```

## Quick start

```powershell
# Coverage for the three languages that run locally
py -3.11 quality/coverage/run_coverage.py --python --node --frontend

# API, UI and load tests (the stack must be running)
py -3.11 quality/postman/run_newman.py
py -3.11 quality/selenium/run_selenium.py
py -3.11 quality/jmeter/run_jmeter.py

# Security
py -3.11 quality/zap/run_zap.py
py -3.11 quality/snyk/run_snyk.py

# Static analysis
$env:SONAR_TOKEN = "<token>"
py -3.11 quality/sonar/run_sonar.py
```

Or run a group:

```powershell
py -3.11 quality/run_all.py --coverage
py -3.11 quality/run_all.py --dynamic
py -3.11 quality/run_all.py --all
```

## Reports

`quality/reports/` is generated and git-ignored. Keep the XML/JSON summaries
needed for the report and regenerate the HTML dashboards on demand.

## Notes

- The Java toolchain requires a JDK 25 matching `java.version=25` in
  `package-service/pom.xml`. The local run used the JDK 25 bundled with the IDE:
  `C:\Users\kamal\.antigravity-ide\extensions\redhat.java-1.58.0-win32-x64\jre\25.0.4.1-win32-x86_64`.
  `mvnw verify` produced 194 Surefire tests, 0 failures, JaCoCo 90.0 % lines /
  84.5 % branches, and 28 Checkstyle warnings. HTML reports:
  `package-service/target/reports/surefire.html`, `jacoco/index.html` and
  `checkstyle.html`. Report screenshots inserted in section 10.6 are stored in
  `res/quality_screenshots/`.
- Load, booking and Selenium tests write to the database. Use a disposable
  database or re-run `db/init/90-seed.sql` afterwards.
- Snyk and SonarQube need external credentials; they are not stored in the repo.
