package com.travelagency.package_service.api;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.travelagency.package_service.client.ExcursionClient;
import com.travelagency.package_service.client.FlightClient;
import com.travelagency.package_service.entity.PackageExcursion;
import com.travelagency.package_service.entity.PackageFlight;
import com.travelagency.package_service.entity.TravelPackage;
import com.travelagency.package_service.repository.PackageExcursionRepository;
import com.travelagency.package_service.repository.PackageFlightRepository;
import com.travelagency.package_service.repository.PackageRepository;
import com.travelagency.package_service.security.TokenHasher;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

/**
 * Shared setup of the MockMvc tests: H2 database (src/test/resources),
 * mocked Flight/Excursion clients, and helpers to build tokens and packages.
 * Every test starts from empty tables.
 */
@SpringBootTest
@AutoConfigureMockMvc
abstract class ApiTestSupport {

    /** Same value as app.jwt.secret in src/test/resources/application.properties. */
    static final String SECRET = "test-jwt-secret-that-is-at-least-32-characters-long";
    static final String JSON = "application/json";

    /** Flights known by the mocked Flight service. */
    static final Map<Long, Map<String, Object>> FLIGHTS = Map.of(
            2L, Map.of("id", 2, "airline", "Royal Air Maroc", "flightNumber", "RAM205",
                    "departureCity", "Casablanca", "arrivalCity", "Marrakech", "availableSeats", 60,
                    "totalSeats", 150, "price", 890.00, "active", true),
            3L, Map.of("id", 3, "airline", "Air France", "flightNumber", "AF1714",
                    "departureCity", "Paris", "arrivalCity", "Istanbul", "availableSeats", 95,
                    "totalSeats", 160, "price", 1980.00, "active", true));

    /** Excursions known by the mocked Excursion service. */
    static final Map<Long, Map<String, Object>> EXCURSIONS = Map.of(
            1L, Map.of("id", 1, "title", "Marrakech medina tour", "location", "Marrakech",
                    "availableSeats", 12, "capacity", 30, "price", 120.00, "available", true),
            2L, Map.of("id", 2, "title", "Bosphorus boat cruise", "location", "Istanbul",
                    "availableSeats", 41, "capacity", 80, "price", 190.00, "available", true));

    private static final AtomicLong SESSION_IDS = new AtomicLong(1);

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    PackageRepository packages;

    @Autowired
    PackageFlightRepository flightLinks;

    @Autowired
    PackageExcursionRepository excursionLinks;

    @MockitoBean
    FlightClient flightClient;

    @MockitoBean
    ExcursionClient excursionClient;

    @BeforeEach
    void resetDatabaseAndMocks() {
        jdbc.update("delete from package_flights");
        jdbc.update("delete from package_excursions");
        jdbc.update("delete from packages");
        jdbc.update("delete from sessions");

        when(flightClient.resource()).thenReturn("flights");
        when(excursionClient.resource()).thenReturn("excursions");
        when(flightClient.findById(anyLong()))
                .thenAnswer(call -> Optional.ofNullable(FLIGHTS.get(call.<Long>getArgument(0))));
        when(excursionClient.findById(anyLong()))
                .thenAnswer(call -> Optional.ofNullable(EXCURSIONS.get(call.<Long>getArgument(0))));
    }

    // ---------------------------------------------------------------- tokens

    /** Kinds of Authorization header used by the parameterized auth tests. */
    enum TokenKind { NONE, NOT_A_JWT, WRONG_SECRET, NO_SESSION, EXPIRED, CLIENT, ADMIN }

    String adminToken() {
        return bearer(1, "ADMIN", true, Instant.now().plus(1, ChronoUnit.HOURS));
    }

    String clientToken() {
        return bearer(2, "CLIENT", true, Instant.now().plus(1, ChronoUnit.HOURS));
    }

    /** @return the Authorization header value, or null for NONE */
    String token(TokenKind kind) {
        Instant inOneHour = Instant.now().plus(1, ChronoUnit.HOURS);

        return switch (kind) {
            case NONE -> null;
            case NOT_A_JWT -> "Bearer not-a-jwt";
            case WRONG_SECRET -> bearer(1, "ADMIN", true, inOneHour, "another-secret-of-at-least-32-characters!!");
            case NO_SESSION -> bearer(1, "ADMIN", false, inOneHour);
            case EXPIRED -> bearer(1, "ADMIN", true, Instant.now().minus(5, ChronoUnit.MINUTES));
            case CLIENT -> clientToken();
            case ADMIN -> adminToken();
        };
    }

    /** Adds the Authorization header unless it is null. */
    static MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder request, String header) {
        return header == null ? request : request.header("Authorization", header);
    }

    String bearer(long userId, String role, boolean withSession, Instant expiresAt) {
        return bearer(userId, role, withSession, expiresAt, SECRET);
    }

    /**
     * Signed like kamal/user/helpers/security.py (HS256, sub/role/email/iat/exp).
     * A random jti keeps tokens unique (sessions.token_hash is UNIQUE).
     * With a session, a row is inserted in `sessions` like the user service does at login.
     */
    String bearer(long userId, String role, boolean withSession, Instant expiresAt, String secret) {
        Instant issuedAt = expiresAt.isBefore(Instant.now())
                ? expiresAt.minus(2, ChronoUnit.HOURS)
                : Instant.now();
        String token = JWT.create()
                .withSubject(String.valueOf(userId))
                .withClaim("role", role)
                .withClaim("email", role.toLowerCase() + "@agency.travel")
                .withJWTId(UUID.randomUUID().toString())
                .withIssuedAt(issuedAt)
                .withExpiresAt(expiresAt)
                .sign(Algorithm.HMAC256(secret));

        if (withSession) {
            jdbc.update("insert into sessions (id, user_id, token_hash, expires_at) values (?, ?, ?, ?)",
                    SESSION_IDS.getAndIncrement(), userId, TokenHasher.sha256Hex(token),
                    LocalDateTime.now(ZoneOffset.UTC).plusHours(1));
        }

        return "Bearer " + token;
    }

    // ---------------------------------------------------------------- data

    TravelPackage savePackage(String name, String destination, String price, String discount,
                              LocalDate start, LocalDate end, boolean active) {
        TravelPackage entity = new TravelPackage();
        entity.setName(name);
        entity.setDescription(name + " description");
        entity.setDestination(destination);
        entity.setDurationNights(3);
        entity.setPrice(new BigDecimal(price));
        entity.setDiscountPercentage(new BigDecimal(discount));
        entity.setStartDate(start);
        entity.setEndDate(end);
        entity.setImageUrl(null);
        entity.setActive(active);

        return packages.saveAndFlush(entity);
    }

    void linkFlight(long packageId, long flightId, int position) {
        flightLinks.saveAndFlush(new PackageFlight(packageId, flightId, position));
    }

    void linkExcursion(long packageId, long excursionId, int position) {
        excursionLinks.saveAndFlush(new PackageExcursion(packageId, excursionId, position));
    }

    static LocalDate inMonths(int months) {
        return LocalDate.now().plusMonths(months);
    }

    /** Admin form body with every value as a string, like the Angular form. */
    static String formJson(String name, String start, String end) {
        return """
                {
                  "name": "%s",
                  "description": "4 nights in the desert",
                  "destination": "Merzouga",
                  "durationNights": "4",
                  "price": "3000",
                  "startDate": "%s",
                  "endDate": "%s",
                  "discountPercentage": "",
                  "imageUrl": "",
                  "active": true
                }
                """.formatted(name, start, end);
    }
}
