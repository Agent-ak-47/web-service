// ---------------------------------------------------------------------------
// Business logic of the flight catalogue (pure, no I/O, no database).
//
// This module holds the domain rules so they can be unit-tested without
// starting the REST server or touching MySQL:
//
//   validateFlight(body)          -> normalises + validates a flight payload
//   checkReserveAvailability(row) -> decides whether a seat reservation is allowed
//   availabilityAfterRelease(row) -> computes the available seats after release
// ---------------------------------------------------------------------------
import {
  asBoolean,
  asDateTime,
  asNonNegativeInt,
  asPositiveInt,
  asPrice,
  asText,
} from '../utils/validate.js';

export function validateFlight(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      error: { status: 400, code: 'INVALID_FORMAT', message: 'A JSON body is required.' },
    };
  }

  const airline = asText(body.airline, 'airline');
  const flightNumber = asText(body.flightNumber, 'flightNumber');
  const departureCity = asText(body.departureCity, 'departureCity');
  const arrivalCity = asText(body.arrivalCity, 'arrivalCity');

  if (!airline) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The airline is required.' } };
  }

  if (!flightNumber) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The flight number is required.' } };
  }

  if (!departureCity) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The departure city is required.' } };
  }

  if (!arrivalCity) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The arrival city is required.' } };
  }

  const departureTime = asDateTime(body.departureTime, '08:00:00');
  if (departureTime === null) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The departure time/date is required.' } };
  }

  const arrivalTime = asDateTime(body.arrivalTime, '11:00:00');
  if (arrivalTime === null) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The arrival time/date is required.' } };
  }

  const totalSeats = asPositiveInt(body.totalSeats);
  if (totalSeats === null) {
    return {
      error: {
        status: 400,
        code: 'MISSING_FIELD',
        message: 'The total seats must be a positive integer.',
      },
    };
  }

  const availableSeats = asNonNegativeInt(body.availableSeats);
  if (availableSeats === null) {
    return {
      error: {
        status: 400,
        code: 'MISSING_FIELD',
        message: 'The available seats must be a non-negative integer.',
      },
    };
  }

  const price = asPrice(body.price);
  if (price === null) {
    return { error: { status: 400, code: 'MISSING_FIELD', message: 'The price is required.' } };
  }

  if (availableSeats > totalSeats) {
    return {
      error: {
        status: 422,
        code: 'BUSINESS_RULE_VIOLATION',
        message: 'Available seats cannot exceed the total seats.',
        details: { totalSeats, availableSeats },
      },
    };
  }

  const depMs = new Date(departureTime.replace(' ', 'T')).getTime();
  const arrMs = new Date(arrivalTime.replace(' ', 'T')).getTime();

  if (arrMs <= depMs) {
    return {
      error: {
        status: 422,
        code: 'BUSINESS_RULE_VIOLATION',
        message: 'Arrival time must be strictly after departure time.',
        details: { departureTime, arrivalTime },
      },
    };
  }

  return {
    data: {
      airline,
      flightNumber,
      departureCity,
      arrivalCity,
      departureTime,
      arrivalTime,
      totalSeats,
      availableSeats,
      price,
      imageUrl: asText(body.imageUrl, 'imageUrl'),
      active: asBoolean(body.active, true),
    },
  };
}

// `row` is the stored flight (snake_case columns): id, active, available_seats, total_seats.
export function checkReserveAvailability(row, quantity) {
  if (!row.active) {
    return {
      ok: false,
      code: 'INSUFFICIENT_AVAILABILITY',
      message: 'This flight is not available.',
      details: { itemId: row.id },
    };
  }

  if (row.available_seats < quantity) {
    return {
      ok: false,
      code: 'INSUFFICIENT_AVAILABILITY',
      message: `Only ${row.available_seats} place(s) are left for this flight.`,
      details: {
        itemId: row.id,
        requested: quantity,
        available: row.available_seats,
      },
    };
  }

  return { ok: true };
}

// A release cannot push the count above the total seats.
export function availabilityAfterRelease(row, quantity) {
  return Math.min(row.total_seats, row.available_seats + quantity);
}
