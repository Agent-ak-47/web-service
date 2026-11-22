# SonarQube — static analysis

SonarQube analyses Python, JavaScript/TypeScript and Java with the same quality gate.
The scanner reads `sonar-project.properties` at the repository root.

## Start the server

```powershell
docker compose -f quality/sonar/docker-compose.sonar.yml up -d
```

Open <http://localhost:9000> (first login `admin` / `admin`), then
**My Account → Security → Generate Tokens**.

## Run the analysis

```powershell
$env:SONAR_TOKEN = "<your token>"
py -3.11 quality/sonar/run_sonar.py
```

The script starts the stack if needed, waits for the server, and runs
`sonarsource/sonar-scanner-cli` against the repository.

## Reports consumed by SonarQube

| Language | Producer | File |
|----------|----------|------|
| Python | Coverage.py / pytest-cov | `quality/reports/coverage/python-*.xml` |
| JavaScript / TypeScript | Istanbul | `quality/reports/coverage/frontend-lcov.info`, `node-*/lcov.info` |
| Java | JaCoCo | `package-service/target/site/jacoco/jacoco.xml` |

Generate them first:

```powershell
py -3.11 quality/coverage/run_coverage.py --python --node --frontend --java
```

The Java step needs the JDK 25 required by `package-service/pom.xml`; with an
older JDK, run the other flags and let the CI produce the JaCoCo report.

## Stop the server

```powershell
py -3.11 quality/sonar/run_sonar.py --stop
```
