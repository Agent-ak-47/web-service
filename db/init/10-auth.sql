-- ---------------------------------------------------------------------------
-- 10-auth.sql  -  Owner: Kamal (branch `kamal`)
-- Database: travel_agency
--
-- Class diagram: User (parent class)
--   Client  (inherits)  -> phone, address
--   Administrator (inherits) -> role
--
-- Chosen model: a single table + specialisation through the `role` column
-- (single concrete table). See md/04-data-model.md for the rationale.
--
-- NOTE: files run in alphabetical order, so `users` exists before
-- `reservations` (50-*) can reference it.
-- ---------------------------------------------------------------------------
USE travel_agency;

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(80)     NOT NULL,
    email         VARCHAR(160)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    role          ENUM('CLIENT','ADMIN') NOT NULL DEFAULT 'CLIENT',
    -- Client attributes
    phone         VARCHAR(30)     NULL,
    address       VARCHAR(255)    NULL,
    -- Administrator attributes
    active        TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- A client must have a phone number: documented application-level constraint
-- (MySQL does not support conditional constraints on a nullable column).

-- Connection log ("Sign in" use case / traceability)
CREATE TABLE IF NOT EXISTS sessions (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       BIGINT UNSIGNED NOT NULL,
    token_hash    CHAR(64)        NOT NULL,
    ip_address    VARCHAR(45)     NULL,
    expires_at    DATETIME        NOT NULL,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_sessions_token (token_hash),
    KEY idx_sessions_user (user_id),
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;