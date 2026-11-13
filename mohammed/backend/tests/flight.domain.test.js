// ---------------------------------------------------------------------------
// Tests unitaires du Domaine Vol (Règles métier, validation, disponibilité)
//
// Identifiants des cas de test : UT-FLI-01 à UT-FLI-16
// ---------------------------------------------------------------------------
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  availabilityAfterRelease,
  checkReserveAvailability,
  validateFlight,
} from '../src/domain/flight.js';

const validBody = () => ({
  airline: 'Royal Air Maroc',
  flightNumber: 'RAM101',
  departureCity: 'Casablanca',
  arrivalCity: 'Paris',
  departureTime: '2026-06-01 08:00:00',
  arrivalTime: '2026-06-01 11:00:00',
  totalSeats: '180',
  availableSeats: '150',
  price: '2450.00',
  imageUrl: 'imgs/flight-1.jpg',
  active: true,
});

// ---------------------------------------------------------------------------
// validateFlight (UT-FLI-01 à UT-FLI-10)
// ---------------------------------------------------------------------------

test('UT-FLI-01: validateFlight - cas nominal (conversions chaînes en nombres et normalisation dates)', () => {
  // Arrange
  const input = validBody();

  // Act
  const result = validateFlight(input);

  // Assert
  assert.equal(result.error, undefined);
  assert.deepEqual(result.data, {
    airline: 'Royal Air Maroc',
    flightNumber: 'RAM101',
    departureCity: 'Casablanca',
    arrivalCity: 'Paris',
    departureTime: '2026-06-01 08:00:00',
    arrivalTime: '2026-06-01 11:00:00',
    totalSeats: 180,
    availableSeats: 150,
    price: 2450,
    imageUrl: 'imgs/flight-1.jpg',
    active: true,
  });
});

test('UT-FLI-02: validateFlight - cas limite (dates au format YYYY-MM-DD avec heures par défaut)', () => {
  // Arrange
  const input = {
    ...validBody(),
    departureTime: '2026-06-01',
    arrivalTime: '2026-06-01',
  };

  // Act
  const result = validateFlight(input);

  // Assert
  assert.equal(result.error, undefined);
  assert.equal(result.data.departureTime, '2026-06-01 08:00:00');
  assert.equal(result.data.arrivalTime, '2026-06-01 11:00:00');
});

test('UT-FLI-03: validateFlight - cas limite (vol avec 0 places disponibles et prix à 0)', () => {
  // Arrange
  const input = {
    ...validBody(),
    availableSeats: '0',
    price: '0',
  };

  // Act
  const result = validateFlight(input);

  // Assert
  assert.equal(result.error, undefined);
  assert.equal(result.data.availableSeats, 0);
  assert.equal(result.data.price, 0);
});

test('UT-FLI-04: validateFlight - erreur (rejet si la compagnie aérienne est absente ou vide)', () => {
  // Arrange
  const body = validBody();
  delete body.airline;

  // Act
  const result = validateFlight(body);

  // Assert
  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'MISSING_FIELD');
  assert.equal(result.error.status, 400);
});

test('UT-FLI-05: validateFlight - erreur (rejet si le numéro de vol est absent ou vide)', () => {
  // Arrange
  const body = validBody();
  body.flightNumber = '   ';

  // Act
  const result = validateFlight(body);

  // Assert
  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'MISSING_FIELD');
  assert.equal(result.error.status, 400);
});

test('UT-FLI-06: validateFlight - erreur (rejet si la ville de départ ou arrivée est absente)', () => {
  // Arrange
  const body = validBody();
  delete body.departureCity;

  // Act
  const result = validateFlight(body);

  // Assert
  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'MISSING_FIELD');
  assert.equal(result.error.status, 400);
});

test('UT-FLI-07: validateFlight - règle de gestion (rejet si availableSeats > totalSeats)', () => {
  // Arrange
  const input = {
    ...validBody(),
    totalSeats: '100',
    availableSeats: '150',
  };

  // Act
  const result = validateFlight(input);

  // Assert
  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'BUSINESS_RULE_VIOLATION');
  assert.equal(result.error.status, 422);
});

test('UT-FLI-08: validateFlight - règle de gestion (rejet si arrivalTime <= departureTime)', () => {
  // Arrange
  const input = {
    ...validBody(),
    departureTime: '2026-06-01 15:00:00',
    arrivalTime: '2026-06-01 12:00:00',
  };

  // Act
  const result = validateFlight(input);

  // Assert
  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'BUSINESS_RULE_VIOLATION');
  assert.equal(result.error.status, 422);
});

test('UT-FLI-09: validateFlight - validation (rejet si prix manquant ou invalide)', () => {
  // Arrange
  const body = validBody();
  delete body.price;

  // Act
  const result = validateFlight(body);

  // Assert
  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'MISSING_FIELD');
  assert.equal(result.error.status, 400);
});

test('UT-FLI-10: validateFlight - validation (rejet si totalSeats non positif ou non entier)', () => {
  // Arrange
  const body = { ...validBody(), totalSeats: '0' };

  // Act
  const result = validateFlight(body);

  // Assert
  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'MISSING_FIELD');
  assert.equal(result.error.status, 400);
});

// ---------------------------------------------------------------------------
// checkReserveAvailability (UT-FLI-11 à UT-FLI-14)
// ---------------------------------------------------------------------------

test('UT-FLI-11: checkReserveAvailability - cas nominal (acceptation si places libres suffisantes)', () => {
  // Arrange
  const flight = { id: 1, active: 1, available_seats: 10, total_seats: 100 };

  // Act
  const result = checkReserveAvailability(flight, 2);

  // Assert
  assert.deepEqual(result, { ok: true });
});

test('UT-FLI-12: checkReserveAvailability - cas limite (quantité demandée exactement égale aux places restantes)', () => {
  // Arrange
  const flight = { id: 1, active: 1, available_seats: 5, total_seats: 100 };

  // Act
  const result = checkReserveAvailability(flight, 5);

  // Assert
  assert.deepEqual(result, { ok: true });
});

test('UT-FLI-13: checkReserveAvailability - règle de gestion (rejet si vol inactif active = 0)', () => {
  // Arrange
  const flight = { id: 1, active: 0, available_seats: 10, total_seats: 100 };

  // Act
  const result = checkReserveAvailability(flight, 1);

  // Assert
  assert.equal(result.ok, false);
  assert.equal(result.code, 'INSUFFICIENT_AVAILABILITY');
  assert.equal(result.details.itemId, 1);
});

test('UT-FLI-14: checkReserveAvailability - règle de gestion (rejet si stock de places insuffisant)', () => {
  // Arrange
  const flight = { id: 1, active: 1, available_seats: 3, total_seats: 100 };

  // Act
  const result = checkReserveAvailability(flight, 5);

  // Assert
  assert.equal(result.ok, false);
  assert.equal(result.code, 'INSUFFICIENT_AVAILABILITY');
  assert.equal(result.details.requested, 5);
  assert.equal(result.details.available, 3);
});

// ---------------------------------------------------------------------------
// availabilityAfterRelease (UT-FLI-15 à UT-FLI-16)
// ---------------------------------------------------------------------------

test('UT-FLI-15: availabilityAfterRelease - cas nominal (réintégration des places libérées)', () => {
  // Arrange
  const flight = { id: 1, available_seats: 50, total_seats: 100 };

  // Act & Assert
  assert.equal(availabilityAfterRelease(flight, 5), 55);
});

test('UT-FLI-16: availabilityAfterRelease - cas limite (plafonnement strict à totalSeats)', () => {
  // Arrange
  const flight = { id: 1, available_seats: 98, total_seats: 100 };

  // Act & Assert
  assert.equal(availabilityAfterRelease(flight, 10), 100);
});
