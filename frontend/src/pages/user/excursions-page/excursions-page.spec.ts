import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
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
        localStorage.clear();
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
        expect(fixture.componentInstance.cards[0].meta[1].value).toMatch(/09:00\s?AM/i);
        expect(fixture.componentInstance.cards[0].meta[2].value).toBe('2h 30min');
    });


    it('should send the filters to the server and build the returned cards', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: [EXCURSION] }));
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(ExcursionsPage);
        fixture.componentInstance.onFiltersChanged({
            location: ' marrakech ',
            date: '2026-11-04',
            maxPrice: '400',
            quantity: '2',
        });

        await fixture.componentInstance.loadExcursions();

        expect(fetchMock.mock.calls[0][0]).toBe(
            'http://localhost:8084/api/excursions'
            + '?location=marrakech&date=2026-11-04&maxPrice=400',
        );
        expect(fixture.componentInstance.cards.length).toBe(1);
        expect(fixture.componentInstance.cards[0].title).toBe('Medina walking tour');
    });


    it('should sync the filters to the URL when submitted', async () => {
        const fixture = TestBed.createComponent(ExcursionsPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.onFiltersChanged({
            location: ' marrakech ',
            quantity: '2',
        });

        await fixture.componentInstance.onFiltersSubmitted();

        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
            queryParams: { location: 'marrakech', quantity: '2' },
        }));
        expect(fixture.componentInstance.filtersTouched).toBe(false);
    });


    it('should reset the filters and clear the URL', async () => {
        const fixture = TestBed.createComponent(ExcursionsPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.onFiltersChanged({ location: 'marrakech' });

        await fixture.componentInstance.onFiltersReset();

        expect(fixture.componentInstance.filter.location).toBe('');
        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
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


    it('should load the initial filters from the URL', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: [EXCURSION] }));
        vi.stubGlobal('fetch', fetchMock);
        const params = convertToParamMap({ location: 'Marrakech', quantity: '2' });
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [ExcursionsPage],
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { queryParamMap: of(params) } },
            ],
        }).compileComponents();
        const fixture = TestBed.createComponent(ExcursionsPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.filter.location).toBe('Marrakech');
        expect(fixture.componentInstance.filter.quantity).toBe('2');
        expect(fetchMock.mock.calls[0][0]).toBe(
            'http://localhost:8084/api/excursions?location=Marrakech',
        );
    });
});
