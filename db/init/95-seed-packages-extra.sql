-- ---------------------------------------------------------------------------
-- 95-seed-packages-extra.sql  -  Extra demo data for the Package service
-- Owner: Youssef (branch `youssef`)
--
-- The rows of 90-seed.sql are dated mid-2026, so they are already in the past.
-- This file adds packages with future dates (2027), the flights and excursions
-- they are composed of, and one inactive package.
--
-- Idempotent: every INSERT is guarded by NOT EXISTS and every id is looked up
-- by a business key, so the file can be run again on an existing database:
--   Get-Content db/init/95-seed-packages-extra.sql |
--     docker exec -i travel_agency_mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"'
-- ---------------------------------------------------------------------------

USE travel_agency;

-- Flights (business key: flight_number + departure_time)
INSERT INTO flights (airline, flight_number, departure_city, arrival_city, departure_time,
                     arrival_time, total_seats, available_seats, price, image_url)
SELECT 'Royal Air Maroc', 'RAM310', 'Casablanca', 'Agadir', '2027-03-14 09:00:00', '2027-03-14 10:15:00',
       120, 80, 750.00, 'imgs/palace/ancient-palace-02.jpeg'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM flights WHERE flight_number = 'RAM310' AND departure_time = '2027-03-14 09:00:00');

INSERT INTO flights (airline, flight_number, departure_city, arrival_city, departure_time,
                     arrival_time, total_seats, available_seats, price, image_url)
SELECT 'EgyptAir', 'MS848', 'Casablanca', 'Cairo', '2027-04-10 10:00:00', '2027-04-10 16:30:00',
       160, 70, 3200.00, 'imgs/palace/riad-upper-view-01.jpeg'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM flights WHERE flight_number = 'MS848' AND departure_time = '2027-04-10 10:00:00');

INSERT INTO flights (airline, flight_number, departure_city, arrival_city, departure_time,
                     arrival_time, total_seats, available_seats, price, image_url)
SELECT 'Turkish Airlines', 'TK2008', 'Istanbul', 'Kayseri', '2027-04-18 07:45:00', '2027-04-18 09:10:00',
       150, 45, 1350.00, 'imgs/palace/riad-upper-view-02.jpeg'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM flights WHERE flight_number = 'TK2008' AND departure_time = '2027-04-18 07:45:00');

INSERT INTO flights (airline, flight_number, departure_city, arrival_city, departure_time,
                     arrival_time, total_seats, available_seats, price, image_url)
SELECT 'Royal Air Maroc', 'RAM450', 'Casablanca', 'Fes', '2027-05-02 08:30:00', '2027-05-02 09:30:00',
       100, 55, 690.00, 'imgs/palace/ancient-palace-03.jpeg'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM flights WHERE flight_number = 'RAM450' AND departure_time = '2027-05-02 08:30:00');

-- Excursions (business key: title + date)
INSERT INTO excursions (title, location, description, date, start_time, duration_minutes,
                        capacity, available_places, price, guide, image_url)
SELECT 'Taghazout surf lesson', 'Agadir', 'Two hours of surf with an instructor, board included.',
       '2027-03-15', '10:00:00', 120, 20, 14, 350.00, 'Omar', 'imgs/sahara/camp-berber-tent.png'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM excursions WHERE title = 'Taghazout surf lesson' AND date = '2027-03-15');

INSERT INTO excursions (title, location, description, date, start_time, duration_minutes,
                        capacity, available_places, price, guide, image_url)
SELECT 'Giza pyramids tour', 'Cairo', 'Pyramids, Sphinx and the Grand Egyptian Museum.',
       '2027-04-11', '08:00:00', 360, 35, 20, 900.00, 'Amira', 'imgs/sahara/market-berber-rugs.jpeg'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM excursions WHERE title = 'Giza pyramids tour' AND date = '2027-04-11');

INSERT INTO excursions (title, location, description, date, start_time, duration_minutes,
                        capacity, available_places, price, guide, image_url)
SELECT 'Cappadocia balloon flight', 'Cappadocia', 'Sunrise hot-air balloon flight over the valleys.',
       '2027-04-19', '05:30:00', 180, 24, 9, 2100.00, 'Emre', 'imgs/palace/riad-courtyard-02.jpeg'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM excursions WHERE title = 'Cappadocia balloon flight' AND date = '2027-04-19');

INSERT INTO excursions (title, location, description, date, start_time, duration_minutes,
                        capacity, available_places, price, guide, image_url)
SELECT 'Fes medina and tanneries', 'Fes', 'Guided walk in Fes el-Bali and the Chouara tannery.',
       '2027-05-03', '09:30:00', 240, 25, 18, 280.00, 'Karim', 'imgs/sahara/market-berber-rugs.jpeg'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM excursions WHERE title = 'Fes medina and tanneries' AND date = '2027-05-03');

-- Packages (business key: name)
INSERT INTO packages (name, description, destination, duration_nights, price, start_date, end_date,
                      discount_percentage, image_url, active)
SELECT 'Agadir sun and surf', '5 nights by the ocean, half board and a surf lesson.',
       'Agadir', 5, 4500.00, '2027-03-14', '2027-06-30', 15.00, 'imgs/palace/ancient-palace-02.jpeg', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Agadir sun and surf');

INSERT INTO packages (name, description, destination, duration_nights, price, start_date, end_date,
                      discount_percentage, image_url, active)
SELECT 'Cairo and the pyramids', '6 nights in Cairo with a full day at Giza.',
       'Cairo', 6, 8900.00, '2027-04-10', '2027-08-31', 5.00, 'imgs/palace/riad-upper-view-01.jpeg', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Cairo and the pyramids');

INSERT INTO packages (name, description, destination, duration_nights, price, start_date, end_date,
                      discount_percentage, image_url, active)
SELECT 'Cappadocia balloons', '4 nights in a cave hotel and a sunrise balloon flight.',
       'Cappadocia', 4, 7400.00, '2027-04-18', '2027-10-15', 0.00, 'imgs/palace/riad-courtyard-02.jpeg', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Cappadocia balloons');

INSERT INTO packages (name, description, destination, duration_nights, price, start_date, end_date,
                      discount_percentage, image_url, active)
SELECT 'Fes imperial city', '3 nights in a riad of the medina, guided visit included.',
       'Fes', 3, 2900.00, '2027-05-02', '2027-09-30', 10.00, 'imgs/palace/ancient-palace-03.jpeg', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Fes imperial city');

-- Composed of the flight/excursion of 90-seed.sql, so it also shows a full
-- composition with the Python mocks (they only know those ids).
INSERT INTO packages (name, description, destination, duration_nights, price, start_date, end_date,
                      discount_percentage, image_url, active)
SELECT 'Marrakech winter escape', '4 nights in a riad, medina tour and desert dinner.',
       'Marrakech', 4, 3200.00, '2026-12-15', '2027-03-31', 20.00, 'imgs/sahara/camp-berber-tent.png', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Marrakech winter escape');

-- Inactive: hidden from the public list, visible in the admin table.
INSERT INTO packages (name, description, destination, duration_nights, price, start_date, end_date,
                      discount_percentage, image_url, active)
SELECT 'Chefchaouen blue city (archived)', '2 nights in the blue city. No longer sold.',
       'Chefchaouen', 2, 1800.00, '2027-02-01', '2027-04-30', 0.00, 'imgs/palace/riad-upper-view-03.jpeg', 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Chefchaouen blue city (archived)');

-- "includes" associations: flights
INSERT INTO package_flights (package_id, flight_id, position)
SELECT p.id, f.id, 1
FROM packages p
JOIN flights f ON f.flight_number = 'RAM310' AND f.departure_time = '2027-03-14 09:00:00'
WHERE p.name = 'Agadir sun and surf'
  AND NOT EXISTS (SELECT 1 FROM package_flights pf WHERE pf.package_id = p.id AND pf.flight_id = f.id);

INSERT INTO package_flights (package_id, flight_id, position)
SELECT p.id, f.id, 1
FROM packages p
JOIN flights f ON f.flight_number = 'MS848' AND f.departure_time = '2027-04-10 10:00:00'
WHERE p.name = 'Cairo and the pyramids'
  AND NOT EXISTS (SELECT 1 FROM package_flights pf WHERE pf.package_id = p.id AND pf.flight_id = f.id);

INSERT INTO package_flights (package_id, flight_id, position)
SELECT p.id, f.id, 1
FROM packages p
JOIN flights f ON f.flight_number = 'TK2008' AND f.departure_time = '2027-04-18 07:45:00'
WHERE p.name = 'Cappadocia balloons'
  AND NOT EXISTS (SELECT 1 FROM package_flights pf WHERE pf.package_id = p.id AND pf.flight_id = f.id);

INSERT INTO package_flights (package_id, flight_id, position)
SELECT p.id, f.id, 1
FROM packages p
JOIN flights f ON f.flight_number = 'RAM450' AND f.departure_time = '2027-05-02 08:30:00'
WHERE p.name = 'Fes imperial city'
  AND NOT EXISTS (SELECT 1 FROM package_flights pf WHERE pf.package_id = p.id AND pf.flight_id = f.id);

INSERT INTO package_flights (package_id, flight_id, position)
SELECT p.id, f.id, 1
FROM packages p
JOIN flights f ON f.flight_number = 'RAM205' AND f.departure_time = '2026-06-05 07:30:00'
WHERE p.name = 'Marrakech winter escape'
  AND NOT EXISTS (SELECT 1 FROM package_flights pf WHERE pf.package_id = p.id AND pf.flight_id = f.id);

-- "includes" associations: excursions
INSERT INTO package_excursions (package_id, excursion_id, position)
SELECT p.id, e.id, 1
FROM packages p
JOIN excursions e ON e.title = 'Taghazout surf lesson' AND e.date = '2027-03-15'
WHERE p.name = 'Agadir sun and surf'
  AND NOT EXISTS (SELECT 1 FROM package_excursions pe WHERE pe.package_id = p.id AND pe.excursion_id = e.id);

INSERT INTO package_excursions (package_id, excursion_id, position)
SELECT p.id, e.id, 1
FROM packages p
JOIN excursions e ON e.title = 'Giza pyramids tour' AND e.date = '2027-04-11'
WHERE p.name = 'Cairo and the pyramids'
  AND NOT EXISTS (SELECT 1 FROM package_excursions pe WHERE pe.package_id = p.id AND pe.excursion_id = e.id);

INSERT INTO package_excursions (package_id, excursion_id, position)
SELECT p.id, e.id, 1
FROM packages p
JOIN excursions e ON e.title = 'Cappadocia balloon flight' AND e.date = '2027-04-19'
WHERE p.name = 'Cappadocia balloons'
  AND NOT EXISTS (SELECT 1 FROM package_excursions pe WHERE pe.package_id = p.id AND pe.excursion_id = e.id);

INSERT INTO package_excursions (package_id, excursion_id, position)
SELECT p.id, e.id, 1
FROM packages p
JOIN excursions e ON e.title = 'Fes medina and tanneries' AND e.date = '2027-05-03'
WHERE p.name = 'Fes imperial city'
  AND NOT EXISTS (SELECT 1 FROM package_excursions pe WHERE pe.package_id = p.id AND pe.excursion_id = e.id);

INSERT INTO package_excursions (package_id, excursion_id, position)
SELECT p.id, e.id, 1
FROM packages p
JOIN excursions e ON e.title = 'Marrakech medina tour' AND e.date = '2026-06-06'
WHERE p.name = 'Marrakech winter escape'
  AND NOT EXISTS (SELECT 1 FROM package_excursions pe WHERE pe.package_id = p.id AND pe.excursion_id = e.id);

INSERT INTO package_excursions (package_id, excursion_id, position)
SELECT p.id, e.id, 2
FROM packages p
JOIN excursions e ON e.title = 'Agafay desert excursion' AND e.date = '2026-06-07'
WHERE p.name = 'Marrakech winter escape'
  AND NOT EXISTS (SELECT 1 FROM package_excursions pe WHERE pe.package_id = p.id AND pe.excursion_id = e.id);
