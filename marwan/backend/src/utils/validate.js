const MAX_TEXT = {
  title: 120,
  location: 120,
  description: 65535,
  guide: 120,
  imageUrl: 255,
};

// The Angular admin form sends every numeric field as a JSON string (see
// md/09 § 4.4). Each helper accepts a number or a numeric string and returns
// the cast number, or null when the value is missing / not a valid number.

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

export function asTime(value) {
  if (typeof value !== 'string') return null;

  const time = value.trim();

  // The form sends HH:mm; the database stores HH:mm:ss.
  if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;

  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;

  return null;
}

export function asText(value, field) {
  if (value === null || value === undefined) return '';

  const text = String(value).trim();
  const limit = MAX_TEXT[field] ?? 255;

  return text.slice(0, limit);
}

export function asBoolean(value) {
  if (typeof value === 'boolean') return value;

  return Boolean(value);
}

export function asPositiveIntQuery(value) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) return null;

  return number;
}
