import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_EXCURSION, KzExcursion } from '../../../models/kz_excursion.interface';
import { DEFAULT_KZ_ITEM_CARD_DATA } from '../../../models/kz_item_card_data.interface';
import { ExcursionsPage } from './excursions-page';


const EXCURSION: KzExcursion = {
    ...DEFAULT_KZ_EXCURSION,
    id: 3,
    title: 'Medina walking tour',
    location: 'Marrakech',
    date: '2026-11-04',
    startTime: '09:00',
    dureeMinutes: 150,
    capacity: 20,
    availableSeats: 6,
    price: 300,
    guide: 'Youssef',
    available: true,
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('ExcursionsPage', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        await TestBed.configureTestingModule({
            imports: [ExcursionsPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should create the page with its filters', () => {
        const fixture = TestBed.createComponent(ExcursionsPage);

        expect(fixture.componentInstance.filters.length).toBe(4);
        expect(fixture.componentInstance.PAGE_TITLE).toBe('Excursions');
    });


    it('should load the excursions and format their duration', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [EXCURSION] })));
        const fixture = TestBed.createComponent(ExcursionsPage);

        await fixture.componentInstance.loadExcursions();

        expect(fixture.componentInstance.excursions.length).toBe(1);
        expect(fixture.componentInstance.cards[0].title).toBe('Medina walking tour');
        expect(fixture.componentInstance.cards[0].meta[2].value).toBe('2h 30min');
    });


    it('should filter the cards by location and price', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [EXCURSION] })));
        const fixture = TestBed.createComponent(ExcursionsPage);
        await fixture.componentInstance.loadExcursions();

        fixture.componentInstance.applyFilters({ location: 'marra', maxPrice: '400' });
        expect(fixture.componentInstance.cards.length).toBe(1);

        fixture.componentInstance.applyFilters({ location: 'fes' });
        expect(fixture.componentInstance.cards.length).toBe(0);
    });


    it('should redirect a signed-out visitor to sign in before booking', () => {
        const fixture = TestBed.createComponent(ExcursionsPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onReserve({ ...DEFAULT_KZ_ITEM_CARD_DATA, id: EXCURSION.id });

        expect(navigate).toHaveBeenCalledWith('/sign-in');
    });


    it('should open the detail page of a card', () => {
        const fixture = TestBed.createComponent(ExcursionsPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onOpen({ ...DEFAULT_KZ_ITEM_CARD_DATA, id: EXCURSION.id });

        expect(navigate).toHaveBeenCalledWith('/excursions/3');
    });
});
