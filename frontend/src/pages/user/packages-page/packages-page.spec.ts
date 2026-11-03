import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_ITEM_CARD_DATA } from '../../../models/kz_item_card_data.interface';
import { DEFAULT_KZ_PACKAGE, KzPackage } from '../../../models/kz_package.interface';
import { PackagesPage } from './packages-page';


const PACKAGE: KzPackage = {
    ...DEFAULT_KZ_PACKAGE,
    id: 2,
    name: 'Marrakech Escape',
    destination: 'Marrakech',
    startDate: '2026-12-01T00:00:00',
    endDate: '2026-12-05T00:00:00',
    durationNights: 4,
    price: 2000,
    promoPrice: 1500,
    discountPercentage: 25,
    available: true,
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('PackagesPage', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [PackagesPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should create the page with its filters', () => {
        const fixture = TestBed.createComponent(PackagesPage);

        expect(fixture.componentInstance.filters.length).toBe(4);
        expect(fixture.componentInstance.PAGE_TITLE).toBe('Packages');
    });


    it('should load the packages and use the promo price', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [PACKAGE] })));
        const fixture = TestBed.createComponent(PackagesPage);

        await fixture.componentInstance.loadPackages();

        expect(fixture.componentInstance.packages.length).toBe(1);
        expect(fixture.componentInstance.cards[0].price).toBe(1500);
        expect(fixture.componentInstance.cards[0].badge).toBe('-25%');
    });


    it('should send the filters to the server and build the returned cards', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: [PACKAGE] }));
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(PackagesPage);
        fixture.componentInstance.onFiltersChanged({
            destination: ' marrakech ',
            startDate: '2026-12-01',
            maxPrice: '1600',
            quantity: '2',
        });

        await fixture.componentInstance.loadPackages();

        expect(fetchMock.mock.calls[0][0]).toBe(
            'http://localhost:8082/api/packages'
            + '?destination=marrakech&startDate=2026-12-01&maxPrice=1600',
        );
        expect(fixture.componentInstance.cards.length).toBe(1);
        expect(fixture.componentInstance.cards[0].price).toBe(1500);
    });


    it('should sync the filters to the URL when submitted', async () => {
        const fixture = TestBed.createComponent(PackagesPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.onFiltersChanged({
            destination: ' marrakech ',
            quantity: '2',
        });

        await fixture.componentInstance.onFiltersSubmitted();

        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
            queryParams: { destination: 'marrakech', quantity: '2' },
        }));
        expect(fixture.componentInstance.filtersTouched).toBe(false);
    });


    it('should reset the filters and clear the URL', async () => {
        const fixture = TestBed.createComponent(PackagesPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.onFiltersChanged({ destination: 'marrakech' });

        await fixture.componentInstance.onFiltersReset();

        expect(fixture.componentInstance.filter.destination).toBe('');
        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
    });


    it('should redirect a signed-out visitor to sign in before booking', () => {
        const fixture = TestBed.createComponent(PackagesPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onReserve({ ...DEFAULT_KZ_ITEM_CARD_DATA, id: PACKAGE.id });

        expect(navigate).toHaveBeenCalledWith('/sign-in');
    });


    it('should open the detail page of a card', () => {
        const fixture = TestBed.createComponent(PackagesPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onOpen({ ...DEFAULT_KZ_ITEM_CARD_DATA, id: PACKAGE.id });

        expect(navigate).toHaveBeenCalledWith('/packages/2');
    });


    it('should load the initial filters from the URL', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: [PACKAGE] }));
        vi.stubGlobal('fetch', fetchMock);
        const params = convertToParamMap({ destination: 'Marrakech', quantity: '2' });
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [PackagesPage],
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { queryParamMap: of(params) } },
            ],
        }).compileComponents();
        const fixture = TestBed.createComponent(PackagesPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.filter.destination).toBe('Marrakech');
        expect(fixture.componentInstance.filter.quantity).toBe('2');
        expect(fetchMock.mock.calls[0][0]).toBe(
            'http://localhost:8082/api/packages?destination=Marrakech',
        );
    });
});
