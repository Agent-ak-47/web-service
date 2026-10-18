-- ---------------------------------------------------------------------------
-- 50-reservation.sql  -  Owner: Kamal (branch `kamal`)
-- Database: travel_agency
--
-- Class diagram:
--   Reservation  +reservationId, +reservationDate, +status, +totalAmount
--                +create(), +cancel(), +calculateTotal()
--   Payment      +paymentId, +amount, +paymentDate, +method, +status
--                +pay(), +refund()
--   Reservation 1 --(1..*)--> Payment        "paid by"
--   Reservation * --(0..1)--> Flight|Excursion "concerns" (polymorphic)
--
-- SECURITY: no bank card number is ever stored. Only the mask (last 4 digits)
-- and the payment provider's transaction reference are kept.
--
-- `reservations.user_id` gets a real foreign key to `users` (10-auth.sql).
-- `(item_type, item_id)` stays polymorphic: a single foreign key cannot point
-- at three different tables, so that link is checked by the service instead.
-- ---------------------------------------------------------------------------
USE travel_agency;

CREATE TABLE IF NOT EXISTS reservations (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reference           VARCHAR(20)     NOT NULL COMMENT 'exposed to the customer, e.g. RES-2026-000123',
    user_id             BIGINT UNSIGNED NOT NULL,
    item_type           ENUM('FLIGHT','PACKAGE','EXCURSION') NOT NULL,
    item_id             BIGINT UNSIGNED NOT NULL COMMENT 'id in flights / packages / excursions',
    item_label          VARCHAR(160)    NULL COMMENT 'product label captured at creation, like unit_price',
    quantity            SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    reservation_date    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    departure_date      DATE            NULL,
    unit_price          DECIMAL(10,2)   NOT NULL DEFAULT 0.00 COMMENT 'price captured at creation time',
    total_amount        DECIMAL(10,2)   NOT NULL DEFAULT 0.00 COMMENT 'calculateTotal()',
    status              ENUM('PENDING','CONFIRMED','PAID','CANCELLED','REFUNDED','EXPIRED')
                                       NOT NULL DEFAULT 'PENDING',
    cancellation_reason VARCHAR(255)    NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_reservations_reference (reference),
    KEY idx_reservations_user (user_id, reservation_date),
    KEY idx_reservations_item (item_type, item_id),
    KEY idx_reservations_status (status),
    CONSTRAINT fk_reservations_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT ck_reservations_total CHECK (total_amount >= 0),
    CONSTRAINT ck_reservations_qty   CHECK (quantity > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reservation_id   BIGINT UNSIGNED NOT NULL,
    amount           DECIMAL(10,2)   NOT NULL,
    method           ENUM('CARD','CASH','BANK_TRANSFER','PAYPAL') NOT NULL,
    status           ENUM('PENDING','SUCCEEDED','FAILED','CANCELLED','REFUNDED') NOT NULL
                                   DEFAULT 'PENDING',
    payment_date     DATETIME        NULL,
    transaction_ref  VARCHAR(64)     NULL COMMENT 'payment provider transaction reference',
    card_mask        VARCHAR(4)      NULL COMMENT 'last 4 digits only',
    error_code       VARCHAR(64)     NULL,
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_payments_transaction (transaction_ref),
    KEY idx_payments_reservation (reservation_id),
    CONSTRAINT fk_payments_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations (id)
        ON DELETE CASCADE,
    CONSTRAINT ck_payments_amount CHECK (amount > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- "Track reservations" use case: history of every status change
CREATE TABLE IF NOT EXISTS reservation_history (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reservation_id  BIGINT UNSIGNED NOT NULL,
    status_before   VARCHAR(20)     NULL,
    status_after    VARCHAR(20)     NOT NULL,
    comment         VARCHAR(255)    NULL,
    actor           VARCHAR(80)     NULL COMMENT 'client, admin or system',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_history_reservation (reservation_id, created_at),
    CONSTRAINT fk_history_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations (id)
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;