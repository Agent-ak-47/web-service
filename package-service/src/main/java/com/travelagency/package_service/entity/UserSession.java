package com.travelagency.package_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

/**
 * Read-only view of the {@code sessions} table owned by the user service.
 * This service never writes to it: it only checks that a token is still open.
 */
@Entity
@Immutable
@Table(name = "sessions")
@Getter
@NoArgsConstructor
public class UserSession {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** SHA-256 of the JWT, lowercase hex. */
    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    /** UTC. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
