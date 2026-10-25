import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_RESERVATION, KzReservation } from '../../../models/kz_reservation.interface';
import { KzReservationStatus } from '../../../models/kz_reservation_status.enum';
import { KzTableAction } from '../../../models/kz_table.interface';
import { ReservationsAdminPage } from './reservations-admin-page';


function reservation(overrides: Partial<KzReservation>): KzReservation {
    return {
        ...DEFAULT_KZ_RESERVATION,
        id: 1,
        reference: 'REF-1',
        typeItem: 'FLIGHT',
        itemLabel: 'Casablanca - Paris',
        quantity: 2,
        totalAmount: 2400,
        status: KzReservationStatus.PENDING,
        reservationDate: '2026-11-01T10:00:00',
        ...overrides,
    };
}


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('ReservationsAdminPage', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReservationsAdminPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should build the rows and the status-dependent actions', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            data: [
                reservation({ id: 1, status: KzReservationStatus.PENDING, reservationDate: '2026-11-03T10:00:00' }),
                reservation({
                    id: 2,
                    reference: 'REF-2',
                    status: KzReservationStatus.PAID,
                    reservationDate: '2026-11-02T10:00:00',
                }),
                reservation({
                    id: 3,
                    reference: 'REF-3',
                    status: KzReservationStatus.CANCELLED,
                    reservationDate: '2026-11-01T10:00:00',
                }),
            ],
        })));
        const fixture = TestBed.createComponent(ReservationsAdminPage);

        await fixture.componentInstance.loadReservations();

        expect(fixture.componentInstance.rows.length).toBe(3);
        expect(fixture.componentInstance.rows[0].cells['reference']).toBe('REF-1');
        expect(fixture.componentInstance.rows.find((row) => row.id === 1)?.actions)
            .toEqual([KzTableAction.CANCEL]);

        const paid = fixture.componentInstance.rows.find((row) => row.id === 2);
        expect(paid?.actions).toContain(KzTableAction.REFUND);
        expect(fixture.componentInstance.rows.find((row) => row.id === 3)?.actions)
            .toEqual([KzTableAction.REFUND]);
    });


    it('should filter the rows by search, status and type', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            data: [
                reservation({ id: 1, reference: 'ALPHA' }),
                reservation({ id: 2, reference: 'BETA', status: KzReservationStatus.PAID, typeItem: 'PACKAGE' }),
            ],
        })));
        const fixture = TestBed.createComponent(ReservationsAdminPage);
        await fixture.componentInstance.loadReservations();

        fixture.componentInstance.onFiltersChanged({ search: 'alpha', status: '', type: '' });
        expect(fixture.componentInstance.rows.length).toBe(1);

        fixture.componentInstance.onFiltersChanged({ search: '', status: KzReservationStatus.PAID, type: '' });
        expect(fixture.componentInstance.rows[0].id).toBe(2);

        fixture.componentInstance.onFiltersChanged({ search: '', status: '', type: 'PACKAGE' });
        expect(fixture.componentInstance.rows[0].id).toBe(2);

        fixture.componentInstance.onFiltersReset();
        expect(fixture.componentInstance.rows.length).toBe(2);
    });


    it('should open the cancellation dialog', () => {
        const fixture = TestBed.createComponent(ReservationsAdminPage);
        const target = reservation({ id: 1 });
        fixture.componentInstance.reservations = [target];

        fixture.componentInstance.onActionDone({ action: KzTableAction.CANCEL, rowId: 1 });

        expect(fixture.componentInstance.isDialogOpen).toBe(true);
        expect(fixture.componentInstance.dialogTitle).toBe(fixture.componentInstance.CANCEL_DIALOG_TITLE);
        expect(fixture.componentInstance.confirmLabel).toBe(fixture.componentInstance.CANCEL_CONFIRM_LABEL);
    });


    it('should open the refund dialog', () => {
        const fixture = TestBed.createComponent(ReservationsAdminPage);
        fixture.componentInstance.reservations = [reservation({
            id: 2,
            status: KzReservationStatus.PAID,
        })];

        fixture.componentInstance.onActionDone({ action: KzTableAction.REFUND, rowId: 2 });

        expect(fixture.componentInstance.dialogTitle).toBe(fixture.componentInstance.REFUND_DIALOG_TITLE);
        expect(fixture.componentInstance.isRefund).toBe(true);
    });


    it('should cancel the booking and close the dialog', async () => {
        const target = reservation({ id: 1 });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: target })));
        const fixture = TestBed.createComponent(ReservationsAdminPage);
        fixture.componentInstance.reservations = [target];
        fixture.componentInstance.rows = [{ id: target.id, cells: {}, actions: [KzTableAction.CANCEL] }];
        fixture.componentInstance.onActionDone({ action: KzTableAction.CANCEL, rowId: target.id });

        await fixture.componentInstance.onConfirm();

        expect(fixture.componentInstance.reservations[0].status).toBe(KzReservationStatus.CANCELLED);
        expect(fixture.componentInstance.isDialogOpen).toBe(false);
        expect(fixture.componentInstance.rows[0].actions).toEqual([KzTableAction.REFUND]);
    });
});
