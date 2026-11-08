package com.travelagency.package_service.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.exceptions.TokenExpiredException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.travelagency.package_service.config.AppProperties;
import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import com.travelagency.package_service.repository.UserSessionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

/**
 * Validates the tokens issued by the user service (same rules as
 * kamal/user/helpers/auth.py): HS256 signature, not expired, and an open row in
 * {@code sessions} whose token_hash is the SHA-256 of the token.
 */
@Service
public class AuthService {

    private static final String BEARER = "Bearer ";

    private final JWTVerifier verifier;
    private final UserSessionRepository sessions;

    public AuthService(AppProperties properties, UserSessionRepository sessions) {
        String secret = properties.jwt() == null ? null : properties.jwt().secret();

        // An empty secret is refused at startup (RequiredSecretsCheck); a random one
        // keeps every token invalid if that check is ever bypassed.
        if (secret == null || secret.isBlank()) {
            secret = UUID.randomUUID().toString() + UUID.randomUUID();
        }

        this.verifier = JWT.require(Algorithm.HMAC256(secret)).build();
        this.sessions = sessions;
    }

    /** @throws ApiException UNAUTHENTICATED / TOKEN_EXPIRED / FORBIDDEN */
    public AuthenticatedUser requireAdmin(String authorizationHeader) {
        AuthenticatedUser user = authenticate(authorizationHeader);

        if (!user.isAdmin()) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Administrator role required.");
        }

        return user;
    }

    /** Lenient check used by public endpoints: any problem simply means "not an admin". */
    public boolean isAdmin(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return false;
        }

        try {
            return authenticate(authorizationHeader).isAdmin();
        }
        catch (ApiException exception) {
            return false;
        }
    }

    /** @throws ApiException UNAUTHENTICATED or TOKEN_EXPIRED */
    public AuthenticatedUser authenticate(String authorizationHeader) {
        String token = extractToken(authorizationHeader)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED, "Authentication is required."));

        DecodedJWT jwt;

        try {
            jwt = verifier.verify(token);
        }
        catch (TokenExpiredException exception) {
            throw new ApiException(ErrorCode.TOKEN_EXPIRED, "The session has expired.");
        }
        catch (JWTVerificationException exception) {
            throw invalidSession();
        }

        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);

        if (!sessions.existsByTokenHashAndExpiresAtAfter(TokenHasher.sha256Hex(token), nowUtc)) {
            throw invalidSession();
        }

        long userId;

        try {
            userId = Long.parseLong(String.valueOf(jwt.getSubject()));
        }
        catch (NumberFormatException exception) {
            throw invalidSession();
        }

        if (userId <= 0) {
            throw invalidSession();
        }

        String role = jwt.getClaim("role").isMissing() ? "CLIENT" : jwt.getClaim("role").asString();

        return new AuthenticatedUser(userId, role, jwt.getClaim("email").asString());
    }

    private static Optional<String> extractToken(String header) {
        if (header == null || !header.startsWith(BEARER)) {
            return Optional.empty();
        }

        String token = header.substring(BEARER.length()).trim();

        return token.isEmpty() ? Optional.empty() : Optional.of(token);
    }

    private static ApiException invalidSession() {
        return new ApiException(ErrorCode.UNAUTHENTICATED, "The session is invalid.");
    }
}
