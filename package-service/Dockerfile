# ---------------------------------------------------------------------------
# Package service (Spring Boot 4, Java 25) - port 8082
# Build context: package-service
#   docker build -t package-service ./package-service
#
# Secrets (DB_PASSWORD, JWT_SECRET) are never baked in: they are passed at
# run time (see package-service/docker-compose.yml). Tests run on the host.
# ---------------------------------------------------------------------------

# ============================== build stage ================================
FROM eclipse-temurin:25-jdk AS build

WORKDIR /build

# 1) Wrapper + pom only: the dependency layer stays cached until pom.xml changes.
COPY mvnw pom.xml ./
COPY .mvn .mvn
# mvnw may have Windows CRLF line endings after a checkout on Windows.
# The image has no curl/wget/unzip: mvnw then downloads Maven with its own
# small Java downloader and unpacks the .tar.gz, which is fine.
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw \
    && ./mvnw -B -q dependency:go-offline

# 2) Sources, then the jar (tests are compiled but not run).
#    The fat jar is then split into Spring Boot layers: dependencies change less
#    often than the application code, so they get their own cached image layers.
COPY src src
RUN ./mvnw -B -q clean package -DskipTests \
    && cp target/package_service-*.jar app.jar \
    && java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extracted

# ============================= runtime stage ===============================
# Alpine JRE: small, and BusyBox wget is available for the HEALTHCHECK.
FROM eclipse-temurin:25-jre-alpine

WORKDIR /app

# The process never runs as root.
RUN addgroup -S -g 10001 appuser && adduser -S -D -H -u 10001 -G appuser appuser

# Least-changing layers first.
COPY --from=build --chown=appuser:appuser /build/extracted/dependencies/ ./
COPY --from=build --chown=appuser:appuser /build/extracted/spring-boot-loader/ ./
COPY --from=build --chown=appuser:appuser /build/extracted/snapshot-dependencies/ ./
COPY --from=build --chown=appuser:appuser /build/extracted/application/ ./

# Uploaded covers are written here; a compose volume keeps them across restarts.
RUN mkdir -p /app/uploads && chown appuser:appuser /app/uploads

USER appuser

# PORT is read by application.properties (server.port=${PORT:8082}).
# MaxRAMPercentage: size the heap from the container memory limit.
ENV PORT=8082 \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8082

# Public endpoint, no token needed; answers 200 once Spring and the DB are up.
# start-period leaves time for the JVM and Hibernate to boot.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api/packages?size=1" || exit 1

# Exploded layered jar: started by the Spring Boot launcher.
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
