import { asBoolean, asPositiveInt, asPrice } from '../utils/validate.js';
import { fail, ok } from '../utils/response.js';
import { persistImage } from '../utils/imageStore.js';
import { availabilityJson, flightJson } from '../utils/serialize.js';
import { validateFlight } from '../domain/flight.js';
import * as service from '../services/flights.js';

const SORT_BY = new Set([
  'price',
  'departureTime',
  'arrivalTime',
  'airline',
  'flightNumber',
  'availableSeats',
  'totalSeats',
]);

function parseId(raw) {
  const id = Number(raw);

  return Number.isInteger(id) && id > 0 ? id : null;
}

// The admin form sends the image as a data URL: store it under uploads/ and
// replace it with the public URL before validation.
async function storeImage(req) {
  if (!req.body || typeof req.body !== 'object') {
    return null;
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const result = await persistImage(req.body.imageUrl, baseUrl);

  if (result.error) {
    return result.error;
  }

  req.body.imageUrl = result.url;

  return null;
}

function parseFilters(query) {
  const order = String(query.order ?? 'asc').toLowerCase();
  const sortBy = String(query.sortBy ?? 'departureTime');
  const quantityRaw = query.quantity ?? query.minSeats;

  return {
    search: (query.search ?? '').trim().slice(0, 120),
    departureCity: (query.departureCity ?? '').trim(),
    arrivalCity: (query.arrivalCity ?? '').trim(),
    airline: (query.airline ?? '').trim(),
    departureDate: (query.departureDate ?? '').trim(),
    arrivalDate: (query.arrivalDate ?? '').trim(),
    minPrice: query.minPrice === undefined ? null : asPrice(query.minPrice),
    maxPrice: query.maxPrice === undefined ? null : asPrice(query.maxPrice),
    quantity: quantityRaw === undefined ? null : asPositiveInt(quantityRaw),
    active: query.active === undefined ? null : asBoolean(query.active),
    sortBy: SORT_BY.has(sortBy) ? sortBy : 'departureTime',
    order: order === 'desc' ? 'desc' : 'asc',
  };
}

export async function listFlights(req, res) {
  const rows = await service.listFlights(parseFilters(req.query));

  return ok(res, rows.map(flightJson));
}

export async function getFlight(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  const row = await service.getFlight(id);

  if (row === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  return ok(res, flightJson(row));
}

export async function createFlight(req, res) {
  const imageError = await storeImage(req);

  if (imageError) {
    return fail(res, imageError.code, imageError.message, 400);
  }

  const parsed = validateFlight(req.body);

  if (parsed.error) {
    return fail(
      res,
      parsed.error.code,
      parsed.error.message,
      parsed.error.status,
      parsed.error.details,
    );
  }

  const result = await service.createFlight(parsed.data);

  if (result.error) {
    return fail(
      res,
      result.error.code,
      result.error.message,
      result.error.status,
    );
  }

  return ok(res, flightJson(result.row), 201);
}

export async function updateFlight(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  const imageError = await storeImage(req);

  if (imageError) {
    return fail(res, imageError.code, imageError.message, 400);
  }

  const parsed = validateFlight(req.body);

  if (parsed.error) {
    return fail(
      res,
      parsed.error.code,
      parsed.error.message,
      parsed.error.status,
      parsed.error.details,
    );
  }

  const result = await service.updateFlight(id, parsed.data);

  if (result === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  if (result.error) {
    return fail(
      res,
      result.error.code,
      result.error.message,
      result.error.status,
    );
  }

  return ok(res, flightJson(result.row));
}

export async function deleteFlight(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  const row = await service.deleteFlight(id);

  if (row === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  return ok(res, flightJson(row));
}

export async function getAvailability(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  const row = await service.checkAvailability(id);

  if (row === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  return ok(res, availabilityJson(row, id));
}

export async function reserve(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  const body = req.body || {};
  const quantity = asPositiveInt(body.quantity);

  if (quantity === null) {
    return fail(res, 'INVALID_FORMAT', 'quantity must be a positive integer.', 400);
  }

  const reservationId = asPositiveInt(body.reservationId);

  const result = await service.reserve(id, quantity, reservationId);

  if (result.status === 404) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  if (result.status === 409) {
    return fail(
      res,
      result.body.code,
      result.body.message,
      409,
      result.body.details,
    );
  }

  return ok(res, result.body);
}

export async function release(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  const body = req.body || {};
  const quantity = asPositiveInt(body.quantity);

  if (quantity === null) {
    return fail(res, 'INVALID_FORMAT', 'quantity must be a positive integer.', 400);
  }

  const reservationId = asPositiveInt(body.reservationId);

  const result = await service.release(id, quantity, reservationId);

  if (result.status === 404) {
    return fail(res, 'NOT_FOUND', 'Flight not found.', 404);
  }

  return ok(res, result.body);
}
