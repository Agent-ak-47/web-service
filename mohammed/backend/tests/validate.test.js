// ---------------------------------------------------------------------------
// Tests unitaires des Utilitaires de Validation et Cast de Types
//
// Identifiants des cas de test : UT-FLI-20 à UT-FLI-25
// ---------------------------------------------------------------------------
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  asBoolean,
  asDate,
  asDateTime,
  asNonNegativeInt,
  asPositiveInt,
  asPrice,
  asText,
} from '../src/utils/validate.js';

test('UT-FLI-20: asPositiveInt - acceptation des entiers positifs et rejet des non-positifs ou invalides', () => {
  assert.equal(asPositiveInt(5), 5);
  assert.equal(asPositiveInt('12'), 12);
  assert.equal(asPositiveInt(0), null);
  assert.equal(asPositiveInt(-1), null);
  assert.equal(asPositiveInt('abc'), null);
  assert.equal(asPositiveInt(true), null);
  assert.equal(asPositiveInt(''), null);
});

test('UT-FLI-21: asNonNegativeInt - acceptation du zéro et des entiers positifs, rejet des négatifs', () => {
  assert.equal(asNonNegativeInt(0), 0);
  assert.equal(asNonNegativeInt('0'), 0);
  assert.equal(asNonNegativeInt('5'), 5);
  assert.equal(asNonNegativeInt(-1), null);
  assert.equal(asNonNegativeInt(false), null);
});

test('UT-FLI-22: asPrice - conversion monétaire, arrondi à deux décimales, rejet des prix négatifs', () => {
  assert.equal(asPrice(10.555), 10.56);
  assert.equal(asPrice('100.5'), 100.5);
  assert.equal(asPrice('0'), 0);
  assert.equal(asPrice(-5), null);
  assert.equal(asPrice(false), null);
  assert.equal(asPrice('abc'), null);
});

test('UT-FLI-23: asDate & asDateTime - normalisation stricte des formats date et date-heure', () => {
  assert.equal(asDate('2026-06-01'), '2026-06-01');
  assert.equal(asDate('invalid-date'), null);

  assert.equal(asDateTime('2026-06-01', '08:00:00'), '2026-06-01 08:00:00');
  assert.equal(asDateTime('2026-06-01 10:30'), '2026-06-01 10:30:00');
  assert.equal(asDateTime('2026-06-01T14:20:00'), '2026-06-01 14:20:00');
  assert.equal(asDateTime('2026-06-01 14:20:00'), '2026-06-01 14:20:00');
  assert.equal(asDateTime('not-a-date'), null);
});

test('UT-FLI-24: asBoolean - conversion robuste des booléens, chaînes et entiers 0/1', () => {
  assert.equal(asBoolean(true), true);
  assert.equal(asBoolean(false), false);
  assert.equal(asBoolean('true'), true);
  assert.equal(asBoolean('false'), false);
  assert.equal(asBoolean(1), true);
  assert.equal(asBoolean(0), false);
});

test('UT-FLI-25: asText - troncature des chaînes selon la taille maximale de colonne', () => {
  assert.equal(asText('RAM101', 'flightNumber'), 'RAM101');
  assert.equal(asText('123456789012345', 'flightNumber').length, 12);
  assert.equal(asText(null, 'airline'), '');
});
