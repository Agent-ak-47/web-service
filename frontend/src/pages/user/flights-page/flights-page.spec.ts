import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_ITEM_CARD_DATA } from '../../../models/kz_item_card_data.interface';
import { DEFAULT_KZ_FLIGHT, KzFlight } from '../../../models/kz_flight.interface';
import { FlightsPage } from './flights-page';


const FLIGHT: KzFlight = {
    ...DEFAULT_KZ_FLIGHT,
    id: 1,
    airline: 'Royal Air Maroc',
    flightNumber: 'AT100',
    departureCity: 'Casablanca',
    arrivalCity: 'Paris',
    departureTime: '2026-11-04T09:00:00',
    arrivalTime: '2026-11-04T12:00:00',
    totalSeats: 120,
    availableSeats: 10,
    price: 1200,
    active: true,
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('FlightsPage', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [FlightsPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should create the page with its filters', () => {
        const fixture = TestBed.createComponent(FlightsPage);

        expect(fixture.componentInstance.filters.length).toBe(5);
        expect(fixture.componentInstance.PAGE_TITLE).toBe('Flights');
    });


    it('should load the flights and build their cards', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [FLIGHT] })));
        const fixture = TestBed.createComponent(FlightsPage);

        await fixture.componentInstance.loadFlights();

        expect(fixture.componentInstance.flights.length).toBe(1);
        expect(fixture.componentInstance.cards[0].title).toBe('Casablanca - Paris');
        expect(fixture.componentInstance.cards[0].price).toBe(1200);
        expect(fixture.componentInstance.cards[0].meta.length).toBe(5);
        expect(fixture.componentInstance.isLoading).toBe(false);
    });


    it('should sort the flights by departure time, newest first', async () => {
        const earlier = { ...FLIGHT, id: 1, departureTime: '2026-11-04T09:00:00' };
        const later = { ...FLIGHT, id: 2, departureTime: '2027-01-01T09:00:00' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [earlier, later] })));
        const fixture = TestBed.createComponent(FlightsPage);

        await fixture.componentInstance.loadFlights();

        expect(fixture.componentInstance.cards[0].id).toBe(later.id);
    });


    it('should mark a flight whose departure date has passed as expired', async () => {
        const past = { ...FLIGHT, departureTime: '2020-01-01T09:00:00', arrivalTime: '2020-01-01T12:00:00' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [past] })));
        const fixture = TestBed.createComponent(FlightsPage);

        await fixture.componentInstance.loadFlights();

        expect(fixture.componentInstance.cards[0].disabled).toBe(true);
        expect(fixture.componentInstance.cards[0].disabledLabel).toBe('Expired');
    });


    it('should send the filters to the server and build the returned cards', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: [FLIGHT] }));
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(FlightsPage);
        fixture.componentInstance.onFiltersChanged({
            departureCity: ' casa ',
            arrivalCity: 'Paris',
            departureDate: '2026-11-04',
            maxPrice: '1300',
            quantity: '2',
        });

        await fixture.componentInstance.loadFlights();

        expect(fetchMock.mock.calls[0][0]).toBe(
            'http://localhost:8081/api/flights'
            + '?departureCity=casa&arrivalCity=Paris&departureDate=2026-11-04&maxPrice=1300',
        );
        expect(fixture.componentInstance.cards.length).toBe(1);
        expect(fixture.componentInstance.cards[0].title).toBe('Casablanca - Paris');
    });


    it('should sync the filters to the URL when submitted', async () => {
        const fixture = TestBed.createComponent(FlightsPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.onFiltersChanged({
            departureCity: ' casa ',
            quantity: '2',
        });

        await fixture.componentInstance.onFiltersSubmitted();

        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
            queryParams: { departureCity: 'casa', quantity: '2' },
        }));
        expect(fixture.componentInstance.filtersTouched).toBe(false);
    });


    it('should reset the filters and clear the URL', async () => {
        const fixture = TestBed.createComponent(FlightsPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.onFiltersChanged({ departureCity: 'casa' });

        await fixture.componentInstance.onFiltersReset();

        expect(fixture.componentInstance.filter.departureCity).toBe('');
        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
    });


    it('should redirect a signed-out visitor to sign in before booking', () => {
        const fixture = TestBed.createComponent(FlightsPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onReserve({
            ...fixture.componentInstance.cards[0],
            id: FLIGHT.id,
        });

        expect(navigate).toHaveBeenCalledWith('/sign-in');
    });


    it('should open the detail page of a card', () => {
        const fixture = TestBed.createComponent(FlightsPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onOpen({ ...DEFAULT_KZ_ITEM_CARD_DATA, id: 9 });

        expect(navigate).toHaveBeenCalledWith('/flights/9');
    });


    it('should load the initial filters from the URL', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: [FLIGHT] }));
        vi.stubGlobal('fetch', fetchMock);
        const params = convertToParamMap({ departureCity: 'casa', quantity: '2' });
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [FlightsPage],
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { queryParamMap: of(params) } },
            ],
        }).compileComponents();
        const fixture = TestBed.createComponent(FlightsPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.filter.departureCity).toBe('casa');
        expect(fixture.componentInstance.filter.quantity).toBe('2');
        expect(fetchMock.mock.calls[0][0]).toBe(
            'http://localhost:8081/api/flights?departureCity=casa',
        );
    });
});
