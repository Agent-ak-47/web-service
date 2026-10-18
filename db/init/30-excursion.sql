-- ---------------------------------------------------------------------------
-- 30-excursion.sql  -  Owner: Marwan (branch `marwan`)
-- Database: travel_agency
--
-- Class diagram: Excursion
--   +excursionId, +title, +location, +date, +capacity, +price
--   +checkAvailability(): boolean
--
-- Runs before 40-package.sql so that packages can reference excursions.
-- ---------------------------------------------------------------------------
USE travel_agency;

CREATE TABLE IF NOT EXISTS excursions (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title              VARCHAR(120)    NOT NULL,
    location           VARCHAR(120)    NOT NULL,
    description        TEXT            NULL,
    date               DATE            NOT NULL,
    start_time         TIME            NOT NULL DEFAULT '09:00:00',
    duration_minutes   SMALLINT UNSIGNED NOT NULL,
    capacity           INT UNSIGNED    NOT NULL,
    available_places   INT UNSIGNED    NOT NULL,
    price              DECIMAL(10,2)   NOT NULL,
    guide              VARCHAR(120)    NULL,
    active             TINYINT(1)      NOT NULL DEFAULT 1,
    image_url          VARCHAR(255)    NULL COMMENT 'cover path returned by the media endpoint',
    created_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_excursions_search (location, date),
    KEY idx_excursions_price (price),
    CONSTRAINT ck_excursions_places   CHECK (available_places <= capacity),
    CONSTRAINT ck_excursions_price    CHECK (price >= 0),
    CONSTRAINT ck_excursions_duration CHECK (duration_minutes > 0),
    CONSTRAINT ck_excursions_capacity CHECK (capacity > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Capacity journal (same principle as flight_seat_movements)
CREATE TABLE IF NOT EXISTS excursion_capacity_movements (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    excursion_id   BIGINT UNSIGNED NOT NULL,
    reservation_id BIGINT UNSIGNED NULL COMMENT 'id of the reservation in the reservation table',
    delta          INT             NOT NULL,
    reason         ENUM('RESERVATION','RELEASE','ADMIN') NOT NULL,
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_capacity_movements_excursion (excursion_id, created_at),
    CONSTRAINT fk_capacity_movements_excursion
        FOREIGN KEY (excursion_id) REFERENCES excursions (id)
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;