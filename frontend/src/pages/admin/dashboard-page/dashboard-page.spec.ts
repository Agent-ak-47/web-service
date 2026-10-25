import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_RESERVATION, KzReservation } from '../../../models/kz_reservation.interface';
import { KzReservationStatus } from '../../../models/kz_reservation_status.enum';
import { DashboardPage } from './dashboard-page';


function reservation(overrides: Partial<KzReservation>): KzReservation {
    return {
        ...DEFAULT_KZ_RESERVATION,
        id: 1,
        reference: 'REF-1',
        reservationDate: '2026-11-01T10:00:00',
        ...overrides,
    };
}


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('DashboardPage', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DashboardPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should compute the statistics and the recent rows', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            data: [
                reservation({ id: 1, status: KzReservationStatus.PAID, totalAmount: 2400 }),
                reservation({ id: 2, status: KzReservationStatus.CANCELLED, totalAmount: 300 }),
                reservation({ id: 3, status: KzReservationStatus.PENDING, totalAmount: 600 }),
            ],
        })));
        const fixture = TestBed.createComponent(DashboardPage);

        await fixture.componentInstance.loadReservations();

        expect(fixture.componentInstance.reservations.length).toBe(3);
        expect(fixture.componentInstance.stats[0].value).toBe('3');
        expect(fixture.componentInstance.stats[1].value).toBe('1');
        expect(fixture.componentInstance.stats[2].value).toBe('1');
        expect(fixture.componentInstance.stats[3].value).toBe('2400.00 MAD');
        expect(fixture.componentInstance.recentRows.length).toBe(3);
    });


    it('should keep only the five most recent bookings', async () => {
        const data = Array.from({ length: 6 }, (_, index) => reservation({
            id: index + 1,
            reference: `REF-${index + 1}`,
            reservationDate: `2026-11-0${index + 1}T10:00:00`,
        }));
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data })));
        const fixture = TestBed.createComponent(DashboardPage);

        await fixture.componentInstance.loadReservations();

        expect(fixture.componentInstance.recentRows.length).toBe(5);
        expect(fixture.componentInstance.recentRows[0].id).toBe(6);
    });


    it('should show the error message when the request fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            error: { code: 'SERVER_ERROR', message: 'Something failed.' },
        }, 500)));
        const fixture = TestBed.createComponent(DashboardPage);

        await fixture.componentInstance.loadReservations();

        expect(fixture.componentInstance.errorMessage).toBe('Something failed.');
        expect(fixture.componentInstance.isLoading).toBe(false);
    });
});
