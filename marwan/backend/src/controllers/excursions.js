import {
  asBoolean,
  asDate,
  asNonNegativeInt,
  asPositiveInt,
  asPrice,
  asText,
  asTime,
} from '../utils/validate.js';
import { fail, ok } from '../utils/response.js';
import { availabilityJson, excursionJson } from '../utils/serialize.js';
import * as service from '../services/excursions.js';

const SORT_BY = new Set(['price', 'date', 'title', 'location', 'durationMinutes']);

function parseBody(req) {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: { status: 400, code: 'INVALID_FORMAT', message: 'A JSON body is required.' } };
  }

  const title = asText(body.title, 'title');
  const location = asText(body.location, 'location');
  const date = asDate(body.date);
  const durationMinutes = asPositiveInt(body.dureeMinutes);
  const capacity = asPositiveInt(body.capacity);
  const availablePlaces = asNonNegativeInt(body.availableSeats);
  const price = asPrice(body.price);

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

  return {
    data: {
      title,
      location,
      description: asText(body.description, 'description'),
      date,
      startTime: asTime(body.startTime) ?? '09:00:00',
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
  const parsed = parseBody(req);

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

  const parsed = parseBody(req);

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
