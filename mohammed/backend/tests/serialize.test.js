// ---------------------------------------------------------------------------
// Tests unitaires de la Sérialisation & Enveloppes JSON
//
// Identifiants des cas de test : UT-FLI-17 à UT-FLI-19
// ---------------------------------------------------------------------------
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { availabilityJson, flightJson, formatIso } from '../src/utils/serialize.js';

test('UT-FLI-17: formatIso - normalisation de date SQL avec espace vers ISO avec T', () => {
  // Arrange
  const sqlDate = '2026-06-01 08:00:00';

  // Act
  const isoDate = formatIso(sqlDate);

  // Assert
  assert.equal(isoDate, '2026-06-01T08:00:00');
});

test('UT-FLI-18: flightJson - transformation ligne SQL snake_case vers contrat JSON camelCase', () => {
  // Arrange
  const row = {
    id: '42',
    airline: 'Air France',
    flight_number: 'AF1714',
    departure_city: 'Paris',
    arrival_city: 'Istanbul',
    departure_time: '2026-07-12 14:00:00',
    arrival_time: '2026-07-12 18:30:00',
    total_seats: '160',
    available_seats: '95',
    price: '1980.00',
    active: 1,
    image_url: 'imgs/flight-3.jpg',
  };

  // Act
  const json = flightJson(row);

  // Assert
  assert.deepEqual(json, {
    id: 42,
    airline: 'Air France',
    flightNumber: 'AF1714',
    departureCity: 'Paris',
    arrivalCity: 'Istanbul',
    departureTime: '2026-07-12T14:00:00',
    arrivalTime: '2026-07-12T18:30:00',
    totalSeats: 160,
    availableSeats: 95,
    price: 1980,
    imageUrl: 'imgs/flight-3.jpg',
    active: true,
  });
});

test('UT-FLI-19: availabilityJson - sérialisation du contrat de disponibilité', () => {
  // Arrange
  const row = {
    id: '1',
    available_seats: '50',
    total_seats: '100',
  };

  // Act
  const json = availabilityJson(row, 1);

  // Assert
  assert.deepEqual(json, {
    id: 1,
    availableSeats: 50,
    totalSeats: 100,
    capacity: 100,
  });
});
