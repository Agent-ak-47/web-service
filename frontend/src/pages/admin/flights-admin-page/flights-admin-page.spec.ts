import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_FLIGHT, KzFlight } from '../../../models/kz_flight.interface';
import { KzTableAction, KzTableActionEvent } from '../../../models/kz_table.interface';
import { GlobalService } from '../../../services/global.service';
import { FlightsAdminPage } from './flights-admin-page';


const FLIGHT: KzFlight = {
    ...DEFAULT_KZ_FLIGHT,
    id: 1,
    airline: 'Royal Air Maroc',
    flightNumber: 'AT100',
    departureCity: 'Casablanca',
    arrivalCity: 'Paris',
    departureTime: '2026-11-04T09:00:00',
    totalSeats: 120,
    availableSeats: 10,
    price: 1200,
    active: true,
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


function actionEvent(action: KzTableAction, rowId: number): KzTableActionEvent {
    return { action, rowId };
}


describe('FlightsAdminPage', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FlightsAdminPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should load the flights into the table', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [FLIGHT] })));
        const fixture = TestBed.createComponent(FlightsAdminPage);

        await fixture.componentInstance.loadFlights();

        expect(fixture.componentInstance.flights.length).toBe(1);
        expect(fixture.componentInstance.rows[0].cells['number']).toBe('AT100');
        expect(fixture.componentInstance.rows[0].cells['active']).toBe(true);
        expect(fixture.componentInstance.isLoading).toBe(false);
    });


    it('should filter the flights and reset the search', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [FLIGHT] })));
        const fixture = TestBed.createComponent(FlightsAdminPage);
        await fixture.componentInstance.loadFlights();

        fixture.componentInstance.onSearchChanged({ search: 'paris' });
        expect(fixture.componentInstance.rows.length).toBe(1);

        fixture.componentInstance.onSearchChanged({ search: 'rabat' });
        expect(fixture.componentInstance.rows.length).toBe(0);

        fixture.componentInstance.onSearchReset();
        expect(fixture.componentInstance.rows.length).toBe(1);
    });


    it('should navigate to the edit and create forms', () => {
        const fixture = TestBed.createComponent(FlightsAdminPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
        fixture.componentInstance.flights = [FLIGHT];

        fixture.componentInstance.onActionDone(actionEvent(KzTableAction.EDIT, FLIGHT.id));
        expect(navigate).toHaveBeenLastCalledWith(
            TestBed.inject(GlobalService).pages.adminFlightFormEdit(FLIGHT.id),
        );

        fixture.componentInstance.onNewFlight();
        expect(navigate).toHaveBeenLastCalledWith(
            TestBed.inject(GlobalService).pages.adminFlightForm,
        );
    });


    it('should delete a flight after confirmation', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: FLIGHT })));
        const fixture = TestBed.createComponent(FlightsAdminPage);
        fixture.componentInstance.flights = [FLIGHT];
        fixture.componentInstance.onActionDone(actionEvent(KzTableAction.REMOVE, FLIGHT.id));

        expect(fixture.componentInstance.isDialogOpen).toBe(true);
        expect(fixture.componentInstance.dialogMessage).toContain('AT100');

        await fixture.componentInstance.onConfirmRemove();

        expect(fixture.componentInstance.flights.length).toBe(0);
        expect(fixture.componentInstance.isDialogOpen).toBe(false);
    });
});
