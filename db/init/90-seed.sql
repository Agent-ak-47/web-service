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
                     arrival_time, total_seats, available_seats, price, image_url)
VALUES
('Royal Air Maroc', 'RAM101', 'Casablanca', 'Paris',        '2026-06-01 08:00:00', '2026-06-01 11:00:00', 180, 150, 2450.00, 'imgs/flight-1.jpg'),
('Royal Air Maroc', 'RAM205', 'Casablanca', 'Marrakech',     '2026-06-05 07:30:00', '2026-06-05 08:30:00', 150,  60,  890.00, 'imgs/flight-2.jpg'),
('Air France',      'AF1714', 'Paris',      'Istanbul',      '2026-07-12 14:00:00', '2026-07-12 18:30:00', 160,  95, 1980.00, 'imgs/flight-3.jpg'),
('Turkish Airlines','TK1826', 'Marrakech',  'Istanbul',      '2026-07-14 09:15:00', '2026-07-14 14:45:00', 140,  22, 2150.00, 'imgs/flight-1.jpg'),
('Royal Air Maroc', 'RAM451', 'Casablanca', 'Marrakech', '2026-12-10 08:00:00', '2026-12-10 09:00:00', 150, 80, 900.00, 'imgs/flight-2.jpg'),
('ITA Airways', 'AZ621', 'Casablanca', 'Rome', '2027-01-02 14:00:00', '2027-01-02 18:10:00', 130, 0, 2890.00, 'imgs/flight-3.jpg'),
('Air Arabia', 'AT211', 'Casablanca', 'Madrid', '2027-02-12 09:20:00', '2027-02-12 11:15:00', 90, 35, 1180.00, 'imgs/flight-1.jpg'),
('Turkish Airlines', 'TK1830', 'Casablanca', 'Istanbul', '2027-03-12 08:40:00', '2027-03-12 14:05:00', 160, 70, 2550.00, 'imgs/flight-2.jpg'),
('Royal Air Maroc', 'RAM903', 'Casablanca', 'Dakar', '2027-04-02 08:30:00', '2027-04-02 11:15:00', 120, 55, 1520.00, 'imgs/flight-3.jpg'),
('Air France', 'AF1717', 'Casablanca', 'Paris', '2027-05-07 12:40:00', '2027-05-07 16:20:00', 140, 90, 2050.00, 'imgs/flight-1.jpg'),
('Royal Air Maroc', 'RAM219', 'Casablanca', 'Fes', '2027-06-04 07:50:00', '2027-06-04 08:55:00', 90, 40, 780.00, 'imgs/flight-2.jpg'),
('Royal Air Maroc', 'RAM417', 'Casablanca', 'Errachidia', '2027-07-09 07:10:00', '2027-07-09 09:00:00', 80, 30, 1150.00, 'imgs/flight-3.jpg'),
('Turkish Airlines', 'TK1836', 'Casablanca', 'Istanbul', '2027-08-06 08:40:00', '2027-08-06 14:05:00', 160, 60, 2680.00, 'imgs/flight-1.jpg'),
('Royal Air Maroc', 'RAM907', 'Casablanca', 'Dakar', '2027-09-03 08:30:00', '2027-09-03 11:15:00', 120, 0, 1580.00, 'imgs/flight-2.jpg'),
('Royal Air Maroc', 'RAM455', 'Casablanca', 'Marrakech', '2027-10-08 08:00:00', '2027-10-08 09:00:00', 150, 90, 850.00, 'imgs/flight-3.jpg'),
('ITA Airways', 'AZ625', 'Casablanca', 'Rome', '2027-11-05 14:00:00', '2027-11-05 18:10:00', 130, 75, 2950.00, 'imgs/flight-1.jpg');

-- Excursions (Marwan)
INSERT INTO excursions (title, location, description, date, start_time, duration_minutes,
                        capacity, available_places, price, guide, image_url)
VALUES
('Marrakech medina tour', 'Marrakech',
 'Guided tour of the medina and the souks.', '2026-06-06', '09:00:00', 180, 30, 12, 120.00, 'Youssef',
 'imgs/excursion-1.jpg'),
('Bosphorus boat cruise', 'Istanbul',
 'Sunset cruise with buffet.', '2026-07-15', '18:00:00', 150, 80, 41, 190.00, 'Selim',
 'imgs/excursion-2.jpg'),
('Agafay desert excursion', 'Marrakech',
 'Dinner and a show under the stars.', '2026-06-07', '16:00:00', 300, 40, 25, 260.00, 'Hassan',
 'imgs/excursion-3.jpg'),
('Marrakech medina at dusk', 'Marrakech', 'Guided walk through the souks and the Koutoubia at sunset.', '2026-12-11', '17:00:00', 180, 30, 20, 300.00, 'Yassine', 'imgs/excursion-1.jpg'),
('Colosseum and Roman Forum', 'Rome', 'Skip-the-line visit of the two symbols of ancient Rome.', '2027-01-03', '09:30:00', 210, 30, 0, 520.00, 'Marco', 'imgs/excursion-2.jpg'),
('Prado Museum tour', 'Madrid', 'Guided tour of the Spanish masters.', '2027-02-13', '10:00:00', 150, 25, 15, 420.00, 'Lucia', 'imgs/excursion-3.jpg'),
('Bosphorus sunset cruise', 'Istanbul', 'Dinner cruise between Europe and Asia.', '2027-03-13', '18:00:00', 150, 40, 25, 580.00, 'Elif', 'imgs/excursion-1.jpg'),
('Goree Island day trip', 'Dakar', 'Ferry, museum and a walk through the island.', '2027-04-03', '08:00:00', 300, 35, 20, 620.00, 'Moussa', 'imgs/excursion-2.jpg'),
('Louvre highlights', 'Paris', 'Skip-the-line entrance and the must-see rooms.', '2027-05-08', '14:00:00', 210, 25, 0, 500.00, 'Claire', 'imgs/excursion-3.jpg'),
('Blue city guided walk', 'Chefchaouen', 'Walk through the blue alleys and the kasbah.', '2027-06-04', '15:00:00', 150, 20, 12, 260.00, 'Hassan', 'imgs/excursion-1.jpg'),
('Dunes camel trek and camp', 'Merzouga', 'Camel ride, sunset and a night under the tent.', '2027-07-10', '16:30:00', 720, 18, 10, 980.00, 'Khalid', 'imgs/excursion-2.jpg'),
('Bosphorus summer cruise', 'Istanbul', 'Boat tour with dinner and live music.', '2027-08-07', '18:30:00', 150, 40, 28, 560.00, 'Elif', 'imgs/excursion-3.jpg'),
('Dakar markets and Goree', 'Dakar', 'Craft markets in the morning and Goree in the afternoon.', '2027-09-04', '08:00:00', 300, 35, 0, 640.00, 'Moussa', 'imgs/excursion-1.jpg'),
('Medina and cooking class', 'Marrakech', 'Market visit followed by a Moroccan cooking class.', '2027-10-09', '09:30:00', 240, 25, 16, 390.00, 'Yassine', 'imgs/excursion-2.jpg'),
('Vatican museums and St Peter', 'Rome', 'Guided visit of the Vatican museums and the basilica.', '2027-11-06', '09:30:00', 240, 30, 18, 610.00, 'Marco', 'imgs/excursion-3.jpg');

-- The three months whose package is unavailable also disable the matching flight
-- and excursion, so the demo can show unbookable items of every type.
UPDATE flights SET active = 0
WHERE id IN (6, 10, 14);

UPDATE excursions SET active = 0
WHERE id IN (5, 9, 13);

-- Packages (Youssef)
INSERT INTO packages (name, description, destination, duration_nights, price, start_date, end_date,
                      discount_percentage, image_url)
VALUES
('Marrakech escape', '3 nights, full board and a visit of the medina.',
 'Marrakech', 3, 2400.00, '2026-06-01', '2026-09-30', 10.00, 'imgs/package-1.jpg'),
('Istanbul wonders', '5 nights, 4-star hotel and historical tours.',
 'Istanbul', 5, 6200.00, '2026-06-15', '2026-10-15', 0.00, 'imgs/package-2.jpg');

-- Monthly packages for the next twelve months (ids 3..14). The three rows with
-- active = 0 demonstrate packages that cannot be booked.
INSERT INTO packages (name, description, destination, duration_nights, price, start_date, end_date,
                      discount_percentage, image_url, active)
VALUES
('Atlas winter escape', '3 nights in Marrakech with return flight, medina tour and breakfast.',
 'Marrakech', 3, 2300.00, '2026-12-10', '2026-12-13', 10.00, 'imgs/package-3.jpg', 1),
('Rome new year', '4 nights in Rome with flight, guided city tour and breakfast.',
 'Rome', 4, 5400.00, '2027-01-02', '2027-01-06', 5.00, 'imgs/package-1.jpg', 0),
('Madrid art week', '3 nights in Madrid with flight, museum pass and tapas tour.',
 'Madrid', 3, 3900.00, '2027-02-12', '2027-02-15', 0.00, 'imgs/package-2.jpg', 1),
('Istanbul winter lights', '5 nights in Istanbul with flight, Bosphorus cruise and museum pass.',
 'Istanbul', 5, 6100.00, '2027-03-12', '2027-03-17', 15.00, 'imgs/package-3.jpg', 1),
('Dakar sunshine', '3 nights in Dakar with flight, Goree Island and the craft market.',
 'Dakar', 3, 3200.00, '2027-04-02', '2027-04-05', 0.00, 'imgs/package-1.jpg', 1),
('Paris spring break', '4 nights in Paris with flight, Louvre museum and free time.',
 'Paris', 4, 5000.00, '2027-05-07', '2027-05-11', 20.00, 'imgs/package-2.jpg', 0),
('Chefchaouen blue days', '2 nights in Chefchaouen with flight and a guided walk in the blue city.',
 'Chefchaouen', 2, 1850.00, '2027-06-04', '2027-06-06', 0.00, 'imgs/package-3.jpg', 1),
('Sahara stars', '2 nights in Merzouga with flight, camel ride and a night under the tent.',
 'Merzouga', 2, 2600.00, '2027-07-09', '2027-07-11', 10.00, 'imgs/package-1.jpg', 1),
('Istanbul summer', '5 nights in Istanbul with flight, boat cruise and historical tours.',
 'Istanbul', 5, 6400.00, '2027-08-06', '2027-08-11', 0.00, 'imgs/package-2.jpg', 1),
('Dakar teranga summer', '4 nights in Dakar with flight, Goree Island and the markets.',
 'Dakar', 4, 4100.00, '2027-09-03', '2027-09-07', 0.00, 'imgs/package-3.jpg', 0),
('Marrakech harvest', '3 nights in Marrakech with flight, medina tour and a cooking class.',
 'Marrakech', 3, 2500.00, '2027-10-08', '2027-10-11', 5.00, 'imgs/package-1.jpg', 1),
('Rome autumn', '4 nights in Rome with flight, guided city tour and breakfast.',
 'Rome', 4, 5200.00, '2027-11-05', '2027-11-09', 10.00, 'imgs/package-2.jpg', 1);

-- "includes" associations
INSERT INTO package_flights (package_id, flight_id, position)
VALUES
(1, 2, 1),
(2, 3, 1),
(2, 4, 2),
(3, 5, 1),
(4, 6, 1),
(5, 7, 1),
(6, 8, 1),
(7, 9, 1),
(8, 10, 1),
(9, 11, 1),
(10, 12, 1),
(11, 13, 1),
(12, 14, 1),
(13, 15, 1),
(14, 16, 1);

INSERT INTO package_excursions (package_id, excursion_id, position)
VALUES
(1, 1, 1),
(1, 3, 2),
(2, 2, 1),
(3, 4, 1),
(4, 5, 1),
(5, 6, 1),
(6, 7, 1),
(7, 8, 1),
(8, 9, 1),
(9, 10, 1),
(10, 11, 1),
(11, 12, 1),
(12, 13, 1),
(13, 14, 1),
(14, 15, 1);
