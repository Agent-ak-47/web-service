import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  asDate,
  asNonNegativeInt,
  asPositiveInt,
  asPrice,
  asTime,
} from '../src/utils/validate.js';

test('asPositiveInt accepts numbers and numeric strings, rejects the rest', () => {
  assert.equal(asPositiveInt(3), 3);
  assert.equal(asPositiveInt('3'), 3);
  assert.equal(asPositiveInt(' 12 '), 12);
  assert.equal(asPositiveInt(0), null);
  assert.equal(asPositiveInt(-1), null);
  assert.equal(asPositiveInt('abc'), null);
  assert.equal(asPositiveInt(true), null);
  assert.equal(asPositiveInt(null), null);
  assert.equal(asPositiveInt(undefined), null);
});

test('asNonNegativeInt accepts zero and rejects negatives', () => {
  assert.equal(asNonNegativeInt(0), 0);
  assert.equal(asNonNegativeInt('18'), 18);
  assert.equal(asNonNegativeInt('-1'), null);
  assert.equal(asNonNegativeInt('x'), null);
});

test('asPrice casts strings, rounds to 2 decimals and rejects negatives', () => {
  assert.equal(asPrice('2400.00'), 2400);
  assert.equal(asPrice('10.505'), 10.51);
  assert.equal(asPrice(0), 0);
  assert.equal(asPrice('-5'), null);
  assert.equal(asPrice('free'), null);
});

test('asDate accepts YYYY-MM-DD only', () => {
  assert.equal(asDate('2026-06-06'), '2026-06-06');
  assert.equal(asDate('2026-6-6'), null);
  assert.equal(asDate('06/06/2026'), null);
  assert.equal(asDate(null), null);
});

test('asTime normalises HH:mm to HH:mm:ss', () => {
  assert.equal(asTime('09:00'), '09:00:00');
  assert.equal(asTime('18:00:00'), '18:00:00');
  assert.equal(asTime('9am'), null);
  assert.equal(asTime(null), null);
});
