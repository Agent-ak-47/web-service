import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
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


function dateOffset(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);

    return date.toISOString().slice(0, 10);
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


    it('should keep the cancel and refund actions whatever the start date', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            data: [
                reservation({
                    id: 1,
                    status: KzReservationStatus.PAID,
                    departureDate: dateOffset(-30),
                }),
                reservation({
                    id: 2,
                    reference: 'REF-2',
                    status: KzReservationStatus.PAID,
                    departureDate: dateOffset(-6),
                }),
            ],
        })));
        const fixture = TestBed.createComponent(ReservationsAdminPage);

        await fixture.componentInstance.loadReservations();

        const old = fixture.componentInstance.rows.find((row) => row.id === 1);
        expect(old?.actions).toContain(KzTableAction.CANCEL);
        expect(old?.actions).toContain(KzTableAction.REFUND);
        const recent = fixture.componentInstance.rows.find((row) => row.id === 2);
        expect(recent?.actions).toContain(KzTableAction.CANCEL);
        expect(recent?.actions).toContain(KzTableAction.REFUND);
    });


    it('should open the cancel dialog for a booking whose start date passed long ago', () => {
        const fixture = TestBed.createComponent(ReservationsAdminPage);
        fixture.componentInstance.reservations = [reservation({
            id: 1,
            status: KzReservationStatus.PAID,
            departureDate: dateOffset(-30),
        })];

        fixture.componentInstance.onActionDone({ action: KzTableAction.CANCEL, rowId: 1 });

        expect(fixture.componentInstance.isDialogOpen).toBe(true);
    });


    it('should send the filters to the server and build the returned rows', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({
            data: [
                reservation({ id: 1, reference: 'ALPHA', status: KzReservationStatus.PAID }),
                reservation({ id: 2, reference: 'BETA', typeItem: 'PACKAGE' }),
            ],
        }));
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(ReservationsAdminPage);
        fixture.componentInstance.onFiltersChanged({
            search: ' alpha ',
            status: KzReservationStatus.PAID,
            typeItem: 'PACKAGE',
        });

        await fixture.componentInstance.loadReservations();

        expect(fetchMock.mock.calls[0][0]).toBe(
            'http://localhost:8085/api/reservations?search=alpha&status=PAID&typeItem=PACKAGE',
        );
        expect(fixture.componentInstance.rows.length).toBe(2);
    });


    it('should sync the filters to the URL when submitted', async () => {
        const fixture = TestBed.createComponent(ReservationsAdminPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.onFiltersChanged({
            search: ' alpha ',
            status: KzReservationStatus.PAID,
            typeItem: 'PACKAGE',
        });

        await fixture.componentInstance.onFiltersSubmitted();

        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
            queryParams: { search: 'alpha', status: 'PAID', typeItem: 'PACKAGE' },
        }));
    });


    it('should clear the URL when the filters are reset', async () => {
        const fixture = TestBed.createComponent(ReservationsAdminPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.search = 'alpha';
        fixture.componentInstance.statusFilter = KzReservationStatus.PAID;
        fixture.componentInstance.typeFilter = 'PACKAGE';

        await fixture.componentInstance.onFiltersReset();

        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
        expect(fixture.componentInstance.search).toBe('');
    });


    it('should load the initial filters from the URL', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: [] }));
        vi.stubGlobal('fetch', fetchMock);
        const params = convertToParamMap({
            search: 'alpha',
            status: KzReservationStatus.PAID,
            typeItem: 'PACKAGE',
        });
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [ReservationsAdminPage],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParamMap: of(params),
                        snapshot: { queryParamMap: params },
                    },
                },
            ],
        }).compileComponents();
        const fixture = TestBed.createComponent(ReservationsAdminPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.search).toBe('alpha');
        expect(fixture.componentInstance.statusFilter).toBe(KzReservationStatus.PAID);
        expect(fixture.componentInstance.typeFilter).toBe('PACKAGE');
        expect(fetchMock.mock.calls[0][0]).toBe(
            'http://localhost:8085/api/reservations?search=alpha&status=PAID&typeItem=PACKAGE',
        );
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
