-- ---------------------------------------------------------------------------
-- 40-package.sql  -  Owner: Youssef (branch `youssef`)
-- Database: travel_agency
--
-- Class diagram: Package
--   +packageId, +name, +destination, +duration, +price
--   +calculatePrice(): double
--   Package --(includes 0..*)--> Flight       (owning association)
--   Package --(includes 0..*)--> Excursion   (owning association)
--
-- Runs after 20-flight.sql and 30-excursion.sql: in a single database the
-- composition tables can use real foreign keys, which the database now
-- enforces on its own.
-- ---------------------------------------------------------------------------
USE travel_agency;

CREATE TABLE IF NOT EXISTS packages (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name                VARCHAR(120)    NOT NULL,
    description         TEXT            NULL,
    destination         VARCHAR(120)    NOT NULL,
    duration_nights     SMALLINT UNSIGNED NOT NULL COMMENT 'number of nights',
    price               DECIMAL(10,2)   NOT NULL,
    start_date          DATE            NULL,
    end_date            DATE            NULL,
    discount_percentage DECIMAL(5,2)    NOT NULL DEFAULT 0.00,
    image_url           VARCHAR(255)    NULL,
    active              TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_packages_destination (destination),
    KEY idx_packages_price (price),
    CONSTRAINT ck_packages_duration CHECK (duration_nights > 0),
    CONSTRAINT ck_packages_price    CHECK (price >= 0),
    CONSTRAINT ck_packages_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    CONSTRAINT ck_packages_dates    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- "includes" association: flights of the package
CREATE TABLE IF NOT EXISTS package_flights (
    package_id  BIGINT UNSIGNED NOT NULL,
    flight_id   BIGINT UNSIGNED NOT NULL,
    position    SMALLINT       NOT NULL DEFAULT 1,
    PRIMARY KEY (package_id, flight_id),
    KEY idx_package_flights_flight (flight_id),
    CONSTRAINT fk_package_flights_package
        FOREIGN KEY (package_id) REFERENCES packages (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_package_flights_flight
        FOREIGN KEY (flight_id) REFERENCES flights (id)
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- "includes" association: excursions of the package
CREATE TABLE IF NOT EXISTS package_excursions (
    package_id    BIGINT UNSIGNED NOT NULL,
    excursion_id  BIGINT UNSIGNED NOT NULL,
    position      SMALLINT       NOT NULL DEFAULT 1,
    PRIMARY KEY (package_id, excursion_id),
    KEY idx_package_excursions_excursion (excursion_id),
    CONSTRAINT fk_package_excursions_package
        FOREIGN KEY (package_id) REFERENCES packages (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_package_excursions_excursion
        FOREIGN KEY (excursion_id) REFERENCES excursions (id)
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;