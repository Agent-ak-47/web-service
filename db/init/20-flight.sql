-- ---------------------------------------------------------------------------
-- 20-flight.sql  -  Owner: Mohammed (branch `mohammed`)
-- Database: travel_agency
--
-- Class diagram: Flight
--   +flightId, +airline, +departureCity, +arrivalCity,
--   +departureDate, +availableSeats, +price
--   +checkAvailability(): boolean
-- ---------------------------------------------------------------------------
USE travel_agency;

CREATE TABLE IF NOT EXISTS flights (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    airline            VARCHAR(80)     NOT NULL,
    flight_number      VARCHAR(12)     NOT NULL,
    departure_city     VARCHAR(80)     NOT NULL,
    arrival_city       VARCHAR(80)     NOT NULL,
    departure_time     DATETIME        NOT NULL,
    arrival_time       DATETIME        NOT NULL,
    total_seats        INT UNSIGNED    NOT NULL DEFAULT 0,
    available_seats    INT UNSIGNED    NOT NULL DEFAULT 0,
    price              DECIMAL(10,2)   NOT NULL,
    active             TINYINT(1)      NOT NULL DEFAULT 1,
    image_url          VARCHAR(255)    NULL COMMENT 'cover path returned by the media endpoint',
    created_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_flights_number_departure (flight_number, departure_time),
    KEY idx_flights_search (departure_city, arrival_city, departure_time),
    KEY idx_flights_price (price),
    CONSTRAINT ck_flights_seats  CHECK (available_seats <= total_seats),
    CONSTRAINT ck_flights_price  CHECK (price >= 0),
    CONSTRAINT ck_flights_dates  CHECK (arrival_time > departure_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- "Check availability" use case: the state is materialised by the Flight service,
-- never by the Reservation service (golden rule: one piece of data, one owner).
CREATE TABLE IF NOT EXISTS flight_seat_movements (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    flight_id      BIGINT UNSIGNED NOT NULL,
    reservation_id BIGINT UNSIGNED NULL COMMENT 'id of the reservation in the reservation table',
    delta          INT             NOT NULL COMMENT '-1 reserved, +1 released',
    reason         ENUM('RESERVATION','RELEASE','ADMIN') NOT NULL,
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seat_movements_flight (flight_id, created_at),
    CONSTRAINT fk_seat_movements_flight
        FOREIGN KEY (flight_id) REFERENCES flights (id)
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;