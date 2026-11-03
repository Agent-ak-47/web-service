import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_AUTH_SESSION } from '../../../models/kz_auth_session.interface';
import { DEFAULT_KZ_RESERVATION, KzReservation } from '../../../models/kz_reservation.interface';
import { KzReservationStatus } from '../../../models/kz_reservation_status.enum';
import { KzTableAction } from '../../../models/kz_table.interface';
import { KzUserRole } from '../../../models/kz_user_role.enum';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { ReservationsPage } from './reservations-page';


function dateOffset(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);

    return date.toISOString().slice(0, 10);
}


function reservation(overrides: Partial<KzReservation>): KzReservation {
    return {
        ...DEFAULT_KZ_RESERVATION,
        reference: 'REF-1',
        typeItem: 'FLIGHT',
        itemLabel: 'Casablanca - Paris',
        quantity: 2,
        totalAmount: 2400,
        status: KzReservationStatus.PENDING,
        reservationDate: '2026-11-01T10:00:00',
        departureDate: dateOffset(5),
        ...overrides,
    };
}


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('ReservationsPage', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [ReservationsPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should load the bookings and build their rows', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            data: [reservation({ id: 1 })],
        })));
        const fixture = TestBed.createComponent(ReservationsPage);

        await fixture.componentInstance.loadReservations();

        expect(fixture.componentInstance.reservations.length).toBe(1);
        expect(fixture.componentInstance.rows[0].cells['reference']).toBe('REF-1');
        expect(fixture.componentInstance.rows[0].actions).toEqual([KzTableAction.CANCEL]);
        expect(fixture.componentInstance.payableReservations.length).toBe(1);
    });


    it('should sort the bookings by most recent first', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            data: [
                reservation({ id: 1, reference: 'OLD', reservationDate: '2026-10-01T10:00:00' }),
                reservation({ id: 2, reference: 'NEW', reservationDate: '2026-11-01T10:00:00' }),
            ],
        })));
        const fixture = TestBed.createComponent(ReservationsPage);

        await fixture.componentInstance.loadReservations();

        expect(fixture.componentInstance.reservations[0].reference).toBe('NEW');
    });


    it('should refuse to cancel a booking whose start date has arrived', () => {
        const fixture = TestBed.createComponent(ReservationsPage);
        const today = reservation({ id: 1, departureDate: dateOffset(0) });

        fixture.componentInstance.onRemove(today);

        expect(fixture.componentInstance.isDialogOpen).toBe(false);
    });


    it('should refuse to cancel a booking whose start date has passed', () => {
        const fixture = TestBed.createComponent(ReservationsPage);
        const past = reservation({ id: 1, departureDate: dateOffset(-30) });

        fixture.componentInstance.onRemove(past);

        expect(fixture.componentInstance.isDialogOpen).toBe(false);
    });


    it('should refuse to cancel a booking one day before the start date', () => {
        const fixture = TestBed.createComponent(ReservationsPage);
        const tomorrow = reservation({ id: 1, departureDate: dateOffset(1) });

        fixture.componentInstance.onRemove(tomorrow);

        expect(fixture.componentInstance.isDialogOpen).toBe(false);
    });


    it('should open the cancellation dialog two days before the start date', () => {
        const fixture = TestBed.createComponent(ReservationsPage);
        const inTwoDays = reservation({ id: 1, departureDate: dateOffset(2) });

        fixture.componentInstance.onRemove(inTwoDays);

        expect(fixture.componentInstance.isDialogOpen).toBe(true);
    });


    it('should open the cancellation dialog for a cancelable booking', () => {
        const fixture = TestBed.createComponent(ReservationsPage);
        const future = reservation({ id: 1 });

        fixture.componentInstance.onRemove(future);

        expect(fixture.componentInstance.isDialogOpen).toBe(true);
        expect(fixture.componentInstance.cancelTarget?.id).toBe(1);
        expect(fixture.componentInstance.dialogMessage).toContain('REF-1');
    });


    it('should let an administrator cancel a booking whatever the start date', () => {
        localStorage.setItem('kz_token', 'token');
        localStorage.setItem('kz_user', JSON.stringify({
            ...DEFAULT_KZ_AUTH_SESSION.user,
            role: KzUserRole.ADMIN,
        }));
        const fixture = TestBed.createComponent(ReservationsPage);
        const recent = reservation({ id: 1, departureDate: dateOffset(-30) });

        fixture.componentInstance.onRemove(recent);

        expect(fixture.componentInstance.isDialogOpen).toBe(true);
    });


    it('should cancel the booking and refresh the row', async () => {
        const future = reservation({ id: 9 });
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(response({ data: [future] }))
            .mockResolvedValueOnce(response({ data: { ...future, status: KzReservationStatus.CANCELLED } })));
        const fixture = TestBed.createComponent(ReservationsPage);
        await fixture.componentInstance.loadReservations();
        fixture.componentInstance.onRemove(future);

        fixture.componentInstance.onConfirmCancel();

        await vi.waitFor(() => {
            expect(fixture.componentInstance.reservations[0].status).toBe(KzReservationStatus.CANCELLED);
        });
        expect(fixture.componentInstance.isDialogOpen).toBe(false);
        expect(fixture.componentInstance.rows[0].actions).toEqual([]);
    });


    it('should save the booking and navigate to the payment', () => {
        const fixture = TestBed.createComponent(ReservationsPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
        const target = reservation({ id: 4 });

        fixture.componentInstance.onPay(target);

        expect(TestBed.inject(AuthService).pendingReservation.id).toBe(4);
        expect(navigate).toHaveBeenCalledWith(TestBed.inject(GlobalService).pages.payment);
    });
});
