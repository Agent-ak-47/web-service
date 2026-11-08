import assert from 'node:assert/strict';
import { test } from 'node:test';

import { availabilityJson, excursionJson } from '../src/utils/serialize.js';

test('excursionJson maps snake_case columns to the frozen camelCase contract', () => {
  const row = {
    id: 2,
    title: 'Bosphorus boat cruise',
    location: 'Istanbul',
    description: 'Sunset cruise with buffet.',
    date: '2026-07-15',
    start_time: '18:00:00',
    duration_minutes: 150,
    capacity: 80,
    available_places: 41,
    price: 190,
    guide: 'Selim',
    image_url: 'imgs/excursion-2.jpg',
    active: 1,
  };

  assert.deepEqual(excursionJson(row), {
    id: 2,
    title: 'Bosphorus boat cruise',
    location: 'Istanbul',
    description: 'Sunset cruise with buffet.',
    date: '2026-07-15',
    startTime: '18:00:00',
    dureeMinutes: 150,
    capacity: 80,
    availableSeats: 41,
    price: 190,
    guide: 'Selim',
    imageUrl: 'imgs/excursion-2.jpg',
    available: true,
  });
});

test('excursionJson fills nullable fields with empty defaults', () => {
  const row = {
    id: 3,
    title: 'Agafay desert excursion',
    location: 'Marrakech',
    description: null,
    date: '2026-06-07',
    start_time: '16:00:00',
    duration_minutes: 300,
    capacity: 40,
    available_places: 25,
    price: 260,
    guide: null,
    image_url: null,
    active: 0,
  };

  const json = excursionJson(row);

  assert.equal(json.description, '');
  assert.equal(json.guide, '');
  assert.equal(json.imageUrl, '');
  assert.equal(json.available, false);
});

test('availabilityJson exposes id, availableSeats and capacity', () => {
  const row = { id: 2, available_places: 41, capacity: 80 };

  assert.deepEqual(availabilityJson(row, 2), {
    id: 2,
    availableSeats: 41,
    capacity: 80,
  });
});
