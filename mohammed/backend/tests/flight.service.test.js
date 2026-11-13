// ---------------------------------------------------------------------------
// Tests unitaires du Service Vol avec Dépôt en mémoire (In-Memory Repository)
//
// Conforme au Dossier de Tests Unitaires (Section 5.4) :
// "Le dépôt en mémoire remplace la base de données afin de tester le service
// sans dépendance à MySQL".
// ---------------------------------------------------------------------------
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  availabilityAfterRelease,
  checkReserveAvailability,
  validateFlight,
} from '../src/domain/flight.js';

class InMemoryFlightRepository {
  constructor() {
    this.flights = new Map();
    this.movements = [];
    this.nextId = 1;
  }

  save(flightData) {
    // Vérifier la contrainte d'unicité (flightNumber, departureTime)
    for (const existing of this.flights.values()) {
      if (
        existing.flightNumber === flightData.flightNumber &&
        existing.departureTime === flightData.departureTime
      ) {
        const error = new Error('A flight with this flight number and departure time already exists.');
        error.code = 'CONFLICT';
        error.status = 409;
        throw error;
      }
    }

    const id = flightData.id || this.nextId++;
    const flight = { ...flightData, id };
    this.flights.set(id, flight);
    return flight;
  }

  findById(id) {
    return this.flights.get(id) || null;
  }

  deleteById(id) {
    const flight = this.findById(id);
    if (!flight) return null;
    this.flights.delete(id);
    return flight;
  }

  reserve(id, quantity, reservationId) {
    const flight = this.findById(id);
    if (!flight) {
      return { status: 404, body: { code: 'NOT_FOUND' } };
    }

    // Mapping pour checkReserveAvailability
    const row = {
      id: flight.id,
      active: flight.active ? 1 : 0,
      available_seats: flight.availableSeats,
      total_seats: flight.totalSeats,
    };

    const decision = checkReserveAvailability(row, quantity);
    if (!decision.ok) {
      return { status: 409, body: decision };
    }

    flight.availableSeats -= quantity;
    this.movements.push({
      flightId: id,
      reservationId: reservationId || null,
      delta: -quantity,
      reason: 'RESERVATION',
    });

    return {
      status: 200,
      body: {
        id,
        availableSeats: flight.availableSeats,
        totalSeats: flight.totalSeats,
      },
    };
  }

  release(id, quantity, reservationId) {
    const flight = this.findById(id);
    if (!flight) {
      return { status: 404, body: { code: 'NOT_FOUND' } };
    }

    const row = {
      id: flight.id,
      available_seats: flight.availableSeats,
      total_seats: flight.totalSeats,
    };

    const available = availabilityAfterRelease(row, quantity);
    flight.availableSeats = available;

    this.movements.push({
      flightId: id,
      reservationId: reservationId || null,
      delta: quantity,
      reason: 'RELEASE',
    });

    return {
      status: 200,
      body: {
        id,
        availableSeats: flight.availableSeats,
        totalSeats: flight.totalSeats,
      },
    };
  }

  count() {
    return this.flights.size;
  }

  countMovements() {
    return this.movements.length;
  }
}

// ---------------------------------------------------------------------------
// Scénarios de tests unitaires (Arrange - Act - Assert)
// ---------------------------------------------------------------------------

test('UT-FLI-26: InMemoryFlightRepository - ajouter un vol valide et retrouver par ID', () => {
  // 1. Arrange (Préparer)
  const repo = new InMemoryFlightRepository();
  const flightPayload = {
    airline: 'Royal Air Maroc',
    flightNumber: 'RAM101',
    departureCity: 'Casablanca',
    arrivalCity: 'Paris',
    departureTime: '2026-06-01 08:00:00',
    arrivalTime: '2026-06-01 11:00:00',
    totalSeats: 180,
    availableSeats: 150,
    price: 2450.0,
    active: true,
  };

  // 2. Act (Exécuter)
  const saved = repo.save(flightPayload);

  // 3. Assert (Vérifier)
  assert.equal(repo.count(), 1);
  assert.equal(saved.id, 1);
  assert.equal(saved.flightNumber, 'RAM101');
  const found = repo.findById(1);
  assert.deepEqual(found, saved);
});

test('UT-FLI-27: InMemoryFlightRepository - refuser un vol doublon (même numéro et même heure de départ)', () => {
  // 1. Arrange (Préparer)
  const repo = new InMemoryFlightRepository();
  const flight = {
    airline: 'Royal Air Maroc',
    flightNumber: 'RAM101',
    departureCity: 'Casablanca',
    arrivalCity: 'Paris',
    departureTime: '2026-06-01 08:00:00',
    arrivalTime: '2026-06-01 11:00:00',
    totalSeats: 180,
    availableSeats: 150,
    price: 2450.0,
    active: true,
  };
  repo.save(flight);

  // 2. Act & 3. Assert (Exécuter et vérifier l'exception de conflit)
  assert.throws(
    () => repo.save({ ...flight, price: 3000.0 }),
    (error) => error.code === 'CONFLICT' && error.status === 409,
  );
  assert.equal(repo.count(), 1);
});

test('UT-FLI-28: InMemoryFlightRepository - exécuter une réservation atomique et consigner le mouvement', () => {
  // 1. Arrange (Préparer l'état initial : vol avec 10 places)
  const repo = new InMemoryFlightRepository();
  repo.save({
    id: 1,
    airline: 'Royal Air Maroc',
    flightNumber: 'RAM205',
    departureCity: 'Casablanca',
    arrivalCity: 'Marrakech',
    departureTime: '2026-06-05 07:30:00',
    arrivalTime: '2026-06-05 08:30:00',
    totalSeats: 150,
    availableSeats: 10,
    price: 890.0,
    active: true,
  });

  // 2. Act (Exécuter : réserver 3 places)
  const result = repo.reserve(1, 3, 1001);

  // 3. Assert (Vérifier : succès 200, 7 places restantes, 1 mouvement journalisé avec delta -3)
  assert.equal(result.status, 200);
  assert.equal(result.body.availableSeats, 7);
  assert.equal(repo.findById(1).availableSeats, 7);
  assert.equal(repo.countMovements(), 1);
  assert.deepEqual(repo.movements[0], {
    flightId: 1,
    reservationId: 1001,
    delta: -3,
    reason: 'RESERVATION',
  });
});

test('UT-FLI-29: InMemoryFlightRepository - refuser la réservation si stock insuffisant', () => {
  // 1. Arrange
  const repo = new InMemoryFlightRepository();
  repo.save({
    id: 1,
    airline: 'Royal Air Maroc',
    flightNumber: 'RAM205',
    departureCity: 'Casablanca',
    arrivalCity: 'Marrakech',
    departureTime: '2026-06-05 07:30:00',
    arrivalTime: '2026-06-05 08:30:00',
    totalSeats: 150,
    availableSeats: 2,
    price: 890.0,
    active: true,
  });

  // 2. Act (Tenter de réserver 5 places quand 2 seulement sont disponibles)
  const result = repo.reserve(1, 5, 1002);

  // 3. Assert (Rejet 409 INSUFFICIENT_AVAILABILITY, aucun mouvement enregistré)
  assert.equal(result.status, 409);
  assert.equal(result.body.code, 'INSUFFICIENT_AVAILABILITY');
  assert.equal(repo.findById(1).availableSeats, 2);
  assert.equal(repo.countMovements(), 0);
});

test('UT-FLI-30: InMemoryFlightRepository - exécuter une libération de places et plafonner à totalSeats', () => {
  // 1. Arrange
  const repo = new InMemoryFlightRepository();
  repo.save({
    id: 1,
    airline: 'Royal Air Maroc',
    flightNumber: 'RAM205',
    departureCity: 'Casablanca',
    arrivalCity: 'Marrakech',
    departureTime: '2026-06-05 07:30:00',
    arrivalTime: '2026-06-05 08:30:00',
    totalSeats: 100,
    availableSeats: 98,
    price: 890.0,
    active: true,
  });

  // 2. Act (Libérer 5 places : 98 + 5 = 103, plafonné à totalSeats = 100)
  const result = repo.release(1, 5, 1003);

  // 3. Assert
  assert.equal(result.status, 200);
  assert.equal(result.body.availableSeats, 100);
  assert.equal(repo.findById(1).availableSeats, 100);
  assert.equal(repo.countMovements(), 1);
  assert.deepEqual(repo.movements[0], {
    flightId: 1,
    reservationId: 1003,
    delta: 5,
    reason: 'RELEASE',
  });
});
