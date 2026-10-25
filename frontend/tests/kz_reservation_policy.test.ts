import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { KzReservation } from '../src/models/kz_reservation.interface.ts';
import { canCancelReservation } from '../src/models/kz_reservation_policy.ts';
import { KzReservationStatus } from '../src/models/kz_reservation_status.enum.ts';

const NOW = new Date(2026, 10, 25, 12, 0, 0);


function buildReservation(overrides: Partial<KzReservation> = {}): KzReservation {
    return {
        id: 1,
        reference: 'RES-2026-000001',
        userId: 1,
        typeItem: 'FLIGHT',
        itemId: 1,
        itemLabel: 'Casablanca - Paris',
        quantity: 1,
        unitPrice: 100,
        totalAmount: 100,
        status: KzReservationStatus.PENDING,
        reservationDate: '2026-10-25T10:00:00Z',
        departureDate: '2026-11-04',
        cancellationReason: '',
        ...overrides,
    };
}


test('a client can cancel exactly two days before the start date', () => {
    const reservation = buildReservation({ departureDate: '2026-11-27' });

    assert.equal(canCancelReservation(reservation, false, NOW), true);
});


test('a client cannot cancel one day before the start date', () => {
    const reservation = buildReservation({ departureDate: '2026-11-26' });

    assert.equal(canCancelReservation(reservation, false, NOW), false);
});


test('a client cannot cancel on the start date', () => {
    const reservation = buildReservation({ departureDate: '2026-11-25' });

    assert.equal(canCancelReservation(reservation, false, NOW), false);
});


test('a client cannot cancel after the start date', () => {
    const reservation = buildReservation({ departureDate: '2026-11-24' });

    assert.equal(canCancelReservation(reservation, false, NOW), false);
});


test('an admin can cancel on the start date', () => {
    const reservation = buildReservation({ departureDate: '2026-11-25' });

    assert.equal(canCancelReservation(reservation, true, NOW), true);
});


test('an admin can cancel after the start date', () => {
    const reservation = buildReservation({ departureDate: '2026-11-01' });

    assert.equal(canCancelReservation(reservation, true, NOW), true);
});


test('a client cannot cancel a refunded booking', () => {
    const reservation = buildReservation({
        departureDate: '2026-12-01',
        status: KzReservationStatus.REFUNDED,
    });

    assert.equal(canCancelReservation(reservation, false, NOW), false);
});


test('an admin cannot cancel an expired booking', () => {
    const reservation = buildReservation({
        departureDate: '2026-12-01',
        status: KzReservationStatus.EXPIRED,
    });

    assert.equal(canCancelReservation(reservation, true, NOW), false);
});


test('a client can cancel a legacy booking without a departure date', () => {
    const reservation = buildReservation({ departureDate: '' });

    assert.equal(canCancelReservation(reservation, false, NOW), true);
});


test('the two day boundary ignores the time of day', () => {
    const reservation = buildReservation({ departureDate: '2026-11-27' });
    const lateNow = new Date(2026, 10, 25, 23, 59, 59);

    assert.equal(canCancelReservation(reservation, false, lateNow), true);
});
