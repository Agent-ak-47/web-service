import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_EXCURSION } from '../../../models/kz_excursion.interface';
import { DEFAULT_KZ_FLIGHT } from '../../../models/kz_flight.interface';
import { DEFAULT_KZ_ITEM_CARD_DATA } from '../../../models/kz_item_card_data.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { DEFAULT_KZ_PACKAGE } from '../../../models/kz_package.interface';
import { GlobalService } from '../../../services/global.service';
import { HomePage } from './home-page';


const PACKAGE = {
    ...DEFAULT_KZ_PACKAGE,
    id: 2,
    name: 'Marrakech Escape',
    destination: 'Marrakech',
    startDate: '2026-12-01',
    endDate: '2026-12-05',
    durationNights: 4,
    price: 2000,
    promoPrice: 1500,
    discountPercentage: 25,
};

const FLIGHT = {
    ...DEFAULT_KZ_FLIGHT,
    id: 1,
    airline: 'Royal Air Maroc',
    flightNumber: 'AT100',
    departureCity: 'Casablanca',
    arrivalCity: 'Paris',
    departureTime: '2026-11-04T09:00:00',
    arrivalTime: '2026-11-04T12:00:00',
    price: 1200,
};

const EXCURSION = {
    ...DEFAULT_KZ_EXCURSION,
    id: 3,
    title: 'Medina walking tour',
    location: 'Marrakech',
    date: '2026-11-04',
    startTime: '09:00',
    dureeMinutes: 150,
    price: 300,
    guide: 'Youssef',
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('HomePage', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        await TestBed.configureTestingModule({
            imports: [HomePage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should expose the hero copy and the three actions', () => {
        const fixture = TestBed.createComponent(HomePage);

        expect(fixture.componentInstance.heroActions.length).toBe(3);
        expect(fixture.componentInstance.heroTitle).toBe(TestBed.inject(GlobalService).APP_NAME);
    });


    it('should load the three highlight sections', async () => {
        vi.stubGlobal('fetch', vi.fn((url: string) => {
            if (url.includes('packages')) {
                return Promise.resolve(response({ data: [PACKAGE] }));
            }

            if (url.includes('flights')) {
                return Promise.resolve(response({ data: [FLIGHT] }));
            }

            return Promise.resolve(response({ data: [EXCURSION] }));
        }));
        const fixture = TestBed.createComponent(HomePage);

        await fixture.componentInstance.loadHighlights();

        expect(fixture.componentInstance.sections.length).toBe(3);
        expect(fixture.componentInstance.sections[0].cards[0].price).toBe(1500);
        expect(fixture.componentInstance.sections[1].cards[0].title).toBe('Casablanca - Paris');
        expect(fixture.componentInstance.sections[2].cards[0].meta[2].value).toBe('2h 30min');
        expect(fixture.componentInstance.isLoading).toBe(false);
    });


    it('should show an error when the highlights cannot be loaded', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        const fixture = TestBed.createComponent(HomePage);

        await fixture.componentInstance.loadHighlights();

        expect(fixture.componentInstance.errorMessage).toBeTruthy();
        expect(fixture.componentInstance.isLoading).toBe(false);
    });


    it('should open the detail page matching the card type', () => {
        const fixture = TestBed.createComponent(HomePage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onOpen({ ...DEFAULT_KZ_ITEM_CARD_DATA, id: 2, type: KzItemType.PACKAGE });
        expect(navigate).toHaveBeenLastCalledWith('/packages/2');

        fixture.componentInstance.onOpen({ ...DEFAULT_KZ_ITEM_CARD_DATA, id: 3, type: KzItemType.EXCURSION });
        expect(navigate).toHaveBeenLastCalledWith('/excursions/3');

        fixture.componentInstance.onOpen({ ...DEFAULT_KZ_ITEM_CARD_DATA, id: 1, type: KzItemType.FLIGHT });
        expect(navigate).toHaveBeenLastCalledWith('/flights/1');
    });
});
