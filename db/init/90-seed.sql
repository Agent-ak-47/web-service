-- ---------------------------------------------------------------------------
-- 90-seed.sql  -  Demo data
-- Who can edit it: any member, but each only writes rows into their own tables
-- (request the changes through a PR).
--
-- Demo accounts (shared password: Password123!)
--   admin@agency.travel   -> role ADMIN
--   client@agency.travel  -> role CLIENT
--
-- Insert order follows the foreign keys: users, flights, excursions,
-- packages, then the composition rows.
--
-- Hash format: pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
-- Computation:
--   PBKDF2-HMAC-SHA256(password, salt, 100000 iterations, 32 bytes)
-- (convention shared by all services, see md/05-rest-api-contract.md)
-- ---------------------------------------------------------------------------

USE travel_agency;

-- Auth (Kamal)
INSERT INTO users (name, email, password_hash, role, phone, address)
VALUES
('Administrator', 'admin@agency.travel',
 'pbkdf2_sha256$100000$1cb7cb2899151842c1ac259fe21d923f$03e94ec8e84eec30be4fb7c490b4b30398be57e83fa8a44c1b4f28e6b8e05f1d',
 'ADMIN', NULL, NULL),
('Demo Customer', 'client@agency.travel',
 'pbkdf2_sha256$100000$87b11e59e647d2ced064ddf5b65bcb36$b58dd21d242af54d27e92dd94476ba8d3ebba85885302a80cb0d27722027e748',
 'CLIENT', '+212600000001', '10 Freedom Street, Casablanca');

-- Flights (Mohammed)
INSERT INTO flights (airline, flight_number, departure_city, arrival_city, departure_time,
                     arrival_time, total_seats, available_seats, price)
VALUES
('Royal Air Maroc', 'RAM101', 'Casablanca', 'Paris',        '2026-06-01 08:00:00', '2026-06-01 11:00:00', 180, 150, 2450.00),
('Royal Air Maroc', 'RAM205', 'Casablanca', 'Marrakech',     '2026-06-05 07:30:00', '2026-06-05 08:30:00', 150,  60,  890.00),
('Air France',      'AF1714', 'Paris',      'Istanbul',      '2026-07-12 14:00:00', '2026-07-12 18:30:00', 160,  95, 1980.00),
('Turkish Airlines','TK1826', 'Marrakech',  'Istanbul',      '2026-07-14 09:15:00', '2026-07-14 14:45:00', 140,  22, 2150.00);

-- Excursions (Marwan)
INSERT INTO excursions (title, location, description, date, start_time, duration_minutes,
                        capacity, available_places, price, guide)
VALUES
('Marrakech medina tour', 'Marrakech',
 'Guided tour of the medina and the souks.', '2026-06-06', '09:00:00', 180, 30, 12, 120.00, 'Youssef'),
('Bosphorus boat cruise', 'Istanbul',
 'Sunset cruise with buffet.', '2026-07-15', '18:00:00', 150, 80, 41, 190.00, 'Selim'),
('Agafay desert excursion', 'Marrakech',
 'Dinner and a show under the stars.', '2026-06-07', '16:00:00', 300, 40, 25, 260.00, 'Hassan');

-- Packages (Youssef)
INSERT INTO packages (name, description, destination, duration_nights, price, start_date, end_date, discount_percentage)
VALUES
('Marrakech escape', '3 nights, full board and a visit of the medina.',
 'Marrakech', 3, 2400.00, '2026-06-01', '2026-09-30', 10.00),
('Istanbul wonders', '5 nights, 4-star hotel and historical tours.',
 'Istanbul', 5, 6200.00, '2026-06-15', '2026-10-15', 0.00);

-- "includes" associations
INSERT INTO package_flights (package_id, flight_id, position)
VALUES
(1, 2, 1),
(2, 3, 1),
(2, 4, 2);

INSERT INTO package_excursions (package_id, excursion_id, position)
VALUES
(1, 1, 1),
(1, 3, 2),
(2, 2, 1);