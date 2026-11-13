-- ---------------------------------------------------------------------------
-- 2026-10-18-frontend-alignment.sql
--
-- WHY: the Angular frontend (frontend/src) already sends and displays three
--      fields that the schema did not have. See md/09-frontend-server-db-contract.md
--      § 5 (gaps G1, G2, G3).
--
-- WHEN: `db/init/*.sql` only runs on an EMPTY volume. If your database was
--       created before this file existed, run this script once:
--           docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" travel_agency' < db/migrations/2026-10-18-frontend-alignment.sql
--       On a fresh `docker compose down -v && docker compose up -d` these columns
--       are already created by the init scripts, and every statement below is a
--       no-op.
--
-- NOTE: MySQL (unlike MariaDB) does not support `ADD COLUMN IF NOT EXISTS`,
--       so each change is guarded by an information_schema check.
--
-- OWNERSHIP: one statement per owner, matching db/init.
--   G1 flights.image_url   -> Mohammed (db/init/20-flight.sql)
--   G2 excursions.image_url -> Marwan  (db/init/30-excursion.sql)
--   G3 reservations.item_label -> Kamal (db/init/50-reservation.sql)
-- ---------------------------------------------------------------------------

USE travel_agency;

-- G1 - Mohammed -----------------------------------------------------------
-- The admin flight form sends `imageUrl` and the card / detail page display it.
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'flights' AND COLUMN_NAME = 'image_url') = 0,
    'ALTER TABLE flights ADD COLUMN image_url VARCHAR(255) NULL COMMENT ''cover path returned by the media endpoint'' AFTER active',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- G2 - Marwan -------------------------------------------------------------
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'excursions' AND COLUMN_NAME = 'image_url') = 0,
    'ALTER TABLE excursions ADD COLUMN image_url VARCHAR(255) NULL COMMENT ''cover path returned by the media endpoint'' AFTER active',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- G3 - Kamal --------------------------------------------------------------
-- Captured at creation time like unit_price: the Reservation service must not
-- read the catalogue tables, so the label is stored with the reservation.
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'item_label') = 0,
    'ALTER TABLE reservations ADD COLUMN item_label VARCHAR(160) NULL COMMENT ''product label captured at creation, like unit_price'' AFTER item_id',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill for the rows already present: the label is only knowable from the
-- owning service, so until it is filled by the API the admin table shows the
-- item type instead of a broken empty cell.
UPDATE reservations
SET item_label = CONCAT(item_type, ' #', item_id)
WHERE item_label IS NULL OR item_label = '';
