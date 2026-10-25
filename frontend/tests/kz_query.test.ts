import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addQuery, cleanQueryParams } from '../src/models/kz_query.ts';

test('cleanQueryParams trims and drops empty values', () => {
    assert.deepEqual(cleanQueryParams({
        search: '  rome  ',
        status: '',
        typeItem: '   ',
    }), { search: 'rome' });
});

test('cleanQueryParams keeps every non-empty value', () => {
    assert.deepEqual(cleanQueryParams({
        departureCity: ' Casablanca ',
        arrivalCity: 'Paris',
        maxPrice: '1200',
    }), {
        departureCity: 'Casablanca',
        arrivalCity: 'Paris',
        maxPrice: '1200',
    });
});

test('addQuery appends an encoded query only when needed', () => {
    assert.equal(addQuery('http://localhost/api/flights', {}), 'http://localhost/api/flights');
    assert.equal(
        addQuery('http://localhost/api/flights', { departureCity: 'New York' }),
        'http://localhost/api/flights?departureCity=New+York',
    );
});
