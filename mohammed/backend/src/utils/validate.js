const MAX_TEXT = {
  airline: 80,
  flightNumber: 12,
  departureCity: 80,
  arrivalCity: 80,
  imageUrl: 255,
};

export function asPositiveInt(value) {
  if (typeof value === 'boolean') return null;

  const number = typeof value === 'string' ? value.trim() : value;

  if (number === '' || number === null || number === undefined) return null;

  const parsed = Number(number);

  if (!Number.isInteger(parsed) || parsed <= 0) return null;

  return parsed;
}

export function asNonNegativeInt(value) {
  if (typeof value === 'boolean') return null;

  const number = typeof value === 'string' ? value.trim() : value;

  if (number === '' || number === null || number === undefined) return null;

  const parsed = Number(number);

  if (!Number.isInteger(parsed) || parsed < 0) return null;

  return parsed;
}

export function asPrice(value) {
  if (typeof value === 'boolean') return null;

  const number = typeof value === 'string' ? value.trim() : value;

  if (number === '' || number === null || number === undefined) return null;

  const parsed = Number(number);

  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

export function asDate(value) {
  if (typeof value !== 'string') return null;

  const date = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  return date;
}

export function asDateTime(value, defaultTime = '08:00:00') {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const pad = (n) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  if (typeof value !== 'string') return null;

  let str = value.trim();
  if (!str) return null;

  // Replace T with space
  str = str.replace('T', ' ');

  // Cut off timezone suffix like .000Z or +01:00 if present
  str = str.replace(/(\.\d+)?(Z|[+-]\d{2}:\d{2})$/, '');

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str} ${defaultTime}`;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(str)) {
    return `${str}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }

  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  return null;
}

export function asText(value, field) {
  if (value === null || value === undefined) return '';

  const text = String(value).trim();
  const limit = MAX_TEXT[field] ?? 255;

  return text.slice(0, limit);
}

export function asBoolean(value, defaultValue = true) {
  if (value === undefined || value === null) return defaultValue;

  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return Boolean(value);
}

export function asPositiveIntQuery(value) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) return null;

  return number;
}
