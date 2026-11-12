import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  availabilityAfterRelease,
  checkReserveAvailability,
  validateExcursion,
} from '../src/domain/excursion.js';

const validBody = () => ({
  title: 'Atlas hike',
  location: 'Atlas',
  description: 'A day in the mountains.',
  date: '2026-08-01',
  startTime: '08:30',
  dureeMinutes: '240',
  capacity: '15',
  availableSeats: '15',
  price: '450.00',
  guide: 'Rachid',
  imageUrl: '',
  active: true,
});

// ---------------------------------------------------------------------------
// validateExcursion
// ---------------------------------------------------------------------------

test('validateExcursion: normal case casts string numbers and normalises time', () => {
  const result = validateExcursion(validBody());

  assert.equal(result.error, undefined);
  assert.deepEqual(result.data, {
    title: 'Atlas hike',
    location: 'Atlas',
    description: 'A day in the mountains.',
    date: '2026-08-01',
    startTime: '08:30:00',
    durationMinutes: 240,
    capacity: 15,
    availablePlaces: 15,
    price: 450,
    guide: 'Rachid',
    imageUrl: '',
    active: true,
  });
});

test('validateExcursion: edge case accepts zero available seats and zero price', () => {
  const result = validateExcursion({
    ...validBody(),
    availableSeats: '0',
    price: '0',
  });

  assert.equal(result.error, undefined);
  assert.equal(result.data.availablePlaces, 0);
  assert.equal(result.data.price, 0);
});

test('validateExcursion: edge case defaults the start time when omitted', () => {
  const body = validBody();
  delete body.startTime;

  const result = validateExcursion(body);

  assert.equal(result.error, undefined);
  assert.equal(result.data.startTime, '09:00:00');
});

test('validateExcursion: error case rejects a missing title', () => {
  const body = validBody();
  delete body.title;

  const result = validateExcursion(body);

  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'MISSING_FIELD');
  assert.equal(result.error.status, 400);
});

test('validateExcursion: error case rejects available seats above capacity', () => {
  const result = validateExcursion({ ...validBody(), capacity: '5', availableSeats: '9' });

  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'BUSINESS_RULE_VIOLATION');
  assert.equal(result.error.status, 422);
});

test('validateExcursion: error case rejects an invalid start time (no silent default)', () => {
  const result = validateExcursion({ ...validBody(), startTime: '9am' });

  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'INVALID_FORMAT');
  assert.equal(result.error.status, 400);
});

// ---------------------------------------------------------------------------
// checkReserveAvailability
// ---------------------------------------------------------------------------

test('checkReserveAvailability: normal case allows a reservation with seats left', () => {
  const result = checkReserveAvailability(
    { id: 2, active: 1, available_places: 41, capacity: 80 },
    5,
  );

  assert.deepEqual(result, { ok: true });
});

test('checkReserveAvailability: edge case allows reserving the last seats', () => {
  const result = checkReserveAvailability(
    { id: 2, active: 1, available_places: 5, capacity: 80 },
    5,
  );

  assert.deepEqual(result, { ok: true });
});

test('checkReserveAvailability: error case refuses an insufficient quantity', () => {
  const result = checkReserveAvailability(
    { id: 2, active: 1, available_places: 2, capacity: 80 },
    5,
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INSUFFICIENT_AVAILABILITY');
  assert.equal(result.details.requested, 5);
  assert.equal(result.details.available, 2);
});

test('checkReserveAvailability: error case refuses an inactive excursion', () => {
  const result = checkReserveAvailability(
    { id: 3, active: 0, available_places: 40, capacity: 40 },
    1,
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INSUFFICIENT_AVAILABILITY');
});

// ---------------------------------------------------------------------------
// availabilityAfterRelease
// ---------------------------------------------------------------------------

test('availabilityAfterRelease: normal case adds the released seats', () => {
  assert.equal(
    availabilityAfterRelease({ capacity: 80, available_places: 39 }, 1),
    40,
  );
});

test('availabilityAfterRelease: edge case clamps at the total capacity', () => {
  assert.equal(
    availabilityAfterRelease({ capacity: 80, available_places: 78 }, 5),
    80,
  );
});
