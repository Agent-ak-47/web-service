import { asPositiveInt, asPrice } from '../utils/validate.js';
import { fail, ok } from '../utils/response.js';
import { availabilityJson, excursionJson } from '../utils/serialize.js';
import { validateExcursion } from '../domain/excursion.js';
import * as service from '../services/excursions.js';

const SORT_BY = new Set(['price', 'date', 'title', 'location', 'durationMinutes']);

function parseId(raw) {
  const id = Number(raw);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseFilters(query) {
  const order = String(query.order ?? 'asc').toLowerCase();
  const sortBy = String(query.sortBy ?? 'date').toLowerCase();

  return {
    search: (query.search ?? '').trim().slice(0, 120),
    location: (query.location ?? '').trim(),
    date: (query.date ?? '').trim(),
    fromDate: (query.fromDate ?? '').trim(),
    toDate: (query.toDate ?? '').trim(),
    minPrice: query.minPrice === undefined ? null : asPrice(query.minPrice),
    maxPrice: query.maxPrice === undefined ? null : asPrice(query.maxPrice),
    maxDuration:
      query.maxDuration === undefined ? null : asPositiveInt(query.maxDuration),
    sortBy: SORT_BY.has(sortBy) ? sortBy : 'date',
    order: order === 'desc' ? 'desc' : 'asc',
  };
}

export async function listExcursions(req, res) {
  const rows = await service.listExcursions(parseFilters(req.query));

  return ok(res, rows.map(excursionJson));
}

export async function getExcursion(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  const row = await service.getExcursion(id);

  if (row === null) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  return ok(res, excursionJson(row));
}

export async function createExcursion(req, res) {
  const parsed = validateExcursion(req.body);

  if (parsed.error) {
    return fail(
      res,
      parsed.error.code,
      parsed.error.message,
      parsed.error.status,
      parsed.error.details,
    );
  }

  const row = await service.createExcursion(parsed.data);

  return ok(res, excursionJson(row), 201);
}

export async function updateExcursion(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  const parsed = validateExcursion(req.body);

  if (parsed.error) {
    return fail(
      res,
      parsed.error.code,
      parsed.error.message,
      parsed.error.status,
      parsed.error.details,
    );
  }

  const row = await service.updateExcursion(id, parsed.data);

  if (row === null) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  return ok(res, excursionJson(row));
}

export async function deleteExcursion(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  const row = await service.deleteExcursion(id);

  if (row === null) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  return ok(res, excursionJson(row));
}

export async function getAvailability(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  const row = await service.checkAvailability(id);

  if (row === null) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  return ok(res, availabilityJson(row, id));
}

export async function reserve(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  const body = req.body || {};
  const quantity = asPositiveInt(body.quantity);

  if (quantity === null) {
    return fail(res, 'INVALID_FORMAT', 'quantity must be a positive integer.', 400);
  }

  const reservationId = asPositiveInt(body.reservationId);

  const result = await service.reserve(id, quantity, reservationId);

  if (result.status === 404) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
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
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  const body = req.body || {};
  const quantity = asPositiveInt(body.quantity);

  if (quantity === null) {
    return fail(res, 'INVALID_FORMAT', 'quantity must be a positive integer.', 400);
  }

  const reservationId = asPositiveInt(body.reservationId);

  const result = await service.release(id, quantity, reservationId);

  if (result.status === 404) {
    return fail(res, 'NOT_FOUND', 'Excursion not found.', 404);
  }

  return ok(res, result.body);
}
