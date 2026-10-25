import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
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


    it('should send the search to the server and build the returned rows', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: [FLIGHT] }));
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(FlightsAdminPage);
        fixture.componentInstance.onSearchChanged({ search: ' paris ' });

        await fixture.componentInstance.loadFlights();

        expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8081/api/flights?search=paris');
        expect(fixture.componentInstance.rows.length).toBe(1);
    });


    it('should sync the search to the URL when submitted', async () => {
        const fixture = TestBed.createComponent(FlightsAdminPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.onSearchChanged({ search: ' paris ' });

        await fixture.componentInstance.onSearchSubmitted();

        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
            queryParams: { search: 'paris' },
        }));
    });


    it('should clear the search and the URL when reset', async () => {
        const fixture = TestBed.createComponent(FlightsAdminPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.onSearchChanged({ search: 'paris' });

        await fixture.componentInstance.onSearchReset();

        expect(fixture.componentInstance.search).toBe('');
        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
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


    it('should load the initial search from the URL', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: [FLIGHT] }));
        vi.stubGlobal('fetch', fetchMock);
        const params = convertToParamMap({ search: 'paris' });
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [FlightsAdminPage],
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { queryParamMap: of(params) } },
            ],
        }).compileComponents();
        const fixture = TestBed.createComponent(FlightsAdminPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.search).toBe('paris');
        expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8081/api/flights?search=paris');
    });
});
