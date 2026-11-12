// ---------------------------------------------------------------------------
// Business logic of the excursion catalogue (pure, no I/O, no database).
//
// This module holds the domain rules so they can be unit-tested without
// starting the REST server or touching MySQL:
//
//   validateExcursion(body)       -> normalises + validates an excursion payload
//   checkReserveAvailability(row) -> decides whether a reservation is allowed
//   availabilityAfterRelease(row) -> computes the seat count after a release
// ---------------------------------------------------------------------------
import {
  asBoolean,
  asDate,
  asNonNegativeInt,
  asPositiveInt,
  asPrice,
  asText,
  asTime,
} from '../utils/validate.js';

export function validateExcursion(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      error: { status: 400, code: 'INVALID_FORMAT', message: 'A JSON body is required.' },
    };
  }

  const title = asText(body.title, 'title');
  const location = asText(body.location, 'location');
  const date = asDate(body.date);
  const durationMinutes = asPositiveInt(body.dureeMinutes);
  const capacity = asPositiveInt(body.capacity);
  const availablePlaces = asNonNegativeInt(body.availableSeats);
  const price = asPrice(body.price);
  const startTime = asTime(body.startTime);

  if (!title) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The title is required.' } };
  }

  if (!location) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The location is required.' } };
  }

  if (date === null) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The date is required.' } };
  }

  if (durationMinutes === null) {
    return {
      error: {
        status: 400,
        code: 'MISSING_FIELD',
        message: 'The duration must be a positive number of minutes.',
      },
    };
  }

  if (capacity === null) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The capacity is required.' } };
  }

  if (availablePlaces === null) {
    return {
      error: { status: 400, code: 'MISSING_FIELD', message: 'The available seats are required.' },
    };
  }

  if (price === null) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The price is required.' } };
  }

  if (availablePlaces > capacity) {
    return {
      error: {
        status: 422,
        code: 'BUSINESS_RULE_VIOLATION',
        message: 'Available seats cannot exceed the total capacity.',
        details: { capacity, availableSeats: availablePlaces },
      },
    };
  }

  // A provided but invalid start time is an error, not a silent default.
  if (asText(body.startTime, 'startTime') !== '' && startTime === null) {
    return {
      error: {
        status: 400,
        code: 'INVALID_FORMAT',
        message: 'The start time must be in HH:mm format.',
      },
    };
  }

  return {
    data: {
      title,
      location,
      description: asText(body.description, 'description'),
      date,
      startTime: startTime ?? '09:00:00',
      durationMinutes,
      capacity,
      availablePlaces,
      price,
      guide: asText(body.guide, 'guide'),
      imageUrl: asText(body.imageUrl, 'imageUrl'),
      active: asBoolean(body.active),
    },
  };
}

// `row` is the stored excursion (snake_case columns): id, active,
// available_places, capacity. Returns `{ ok: true }` or `{ ok: false, ... }`.
export function checkReserveAvailability(row, quantity) {
  if (!row.active) {
    return {
      ok: false,
      code: 'INSUFFICIENT_AVAILABILITY',
      message: 'This excursion is not available.',
      details: { itemId: row.id },
    };
  }

  if (row.available_places < quantity) {
    return {
      ok: false,
      code: 'INSUFFICIENT_AVAILABILITY',
      message: `Only ${row.available_places} place(s) are left for this excursion.`,
      details: {
        itemId: row.id,
        requested: quantity,
        available: row.available_places,
      },
    };
  }

  return { ok: true };
}

// A release can never push the count above the total capacity.
export function availabilityAfterRelease(row, quantity) {
  return Math.min(row.capacity, row.available_places + quantity);
}
