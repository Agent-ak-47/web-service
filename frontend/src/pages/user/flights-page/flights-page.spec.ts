import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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


    it('should filter the cards by departure, arrival and price', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [FLIGHT] })));
        const fixture = TestBed.createComponent(FlightsPage);
        await fixture.componentInstance.loadFlights();

        fixture.componentInstance.applyFilters({ departureCity: 'casa', maxPrice: '1300' });
        expect(fixture.componentInstance.cards.length).toBe(1);

        fixture.componentInstance.applyFilters({ departureCity: 'rabat' });
        expect(fixture.componentInstance.cards.length).toBe(0);
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
});
