import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_EXCURSION, KzExcursion } from '../../../models/kz_excursion.interface';
import { GlobalService } from '../../../services/global.service';
import { ItemDetailService } from '../../../services/item-detail.service';
import { ExcursionFormPage } from './excursion-form-page';


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
};

const VALID = {
    title: 'Medina walking tour',
    location: 'Marrakech',
    dureeMinutes: '150',
    capacity: '20',
    availableSeats: '6',
    price: '300',
};

let routeId = '';
const load = vi.fn();


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('ExcursionFormPage', () => {
    beforeEach(async () => {
        routeId = '';
        load.mockReset();
        await TestBed.configureTestingModule({
            imports: [ExcursionFormPage],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        get snapshot() {
                            return {
                                paramMap: convertToParamMap(routeId === '' ? {} : { id: routeId }),
                            };
                        },
                    },
                },
                { provide: ItemDetailService, useValue: { load, reserve: vi.fn() } },
            ],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should start in create mode', () => {
        const fixture = TestBed.createComponent(ExcursionFormPage);
        fixture.detectChanges();

        expect(fixture.componentInstance.isEditing).toBe(false);
        expect(fixture.componentInstance.formTitle).toBe(fixture.componentInstance.CREATE_TITLE);
        expect(fixture.componentInstance.sections.length).toBe(6);
    });


    it('should validate the required fields before saving', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(ExcursionFormPage);

        await fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.errors.title).toBe(fixture.componentInstance.TITLE_ERROR);
        expect(fixture.componentInstance.errors.location).toBe(fixture.componentInstance.LOCATION_ERROR);
        expect(fixture.componentInstance.errors.dureeMinutes).toBe(fixture.componentInstance.DURATION_ERROR);
        expect(fixture.componentInstance.errors.capacity).toBe(fixture.componentInstance.CAPACITY_ERROR);
        expect(fixture.componentInstance.errors.price).toBe(fixture.componentInstance.PRICE_ERROR);
        expect(fetchMock).not.toHaveBeenCalled();
    });


    it('should reject more available seats than the capacity', async () => {
        const fixture = TestBed.createComponent(ExcursionFormPage);
        fixture.componentInstance.onFieldChange({ name: 'availableSeats', value: '30' });
        fixture.componentInstance.onFieldChange({ name: 'capacity', value: '20' });

        await fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.errors.availableSeats).toBe(
            fixture.componentInstance.AVAILABLE_SEATS_ERROR,
        );
    });


    it('should save a new excursion and navigate to the list', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: EXCURSION })));
        const fixture = TestBed.createComponent(ExcursionFormPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        for (const [name, value] of Object.entries(VALID)) {
            fixture.componentInstance.onFieldChange({ name, value });
        }
        await fixture.componentInstance.onSubmit();

        expect(navigate).toHaveBeenCalledWith(TestBed.inject(GlobalService).pages.adminExcursions);
        expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
    });


    it('should load the excursion being edited', async () => {
        routeId = '3';
        load.mockResolvedValue({ item: EXCURSION, error: '', signedOut: false });
        const fixture = TestBed.createComponent(ExcursionFormPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.isEditing).toBe(true);
        expect(fixture.componentInstance.form.title).toBe('Medina walking tour');
        expect(fixture.componentInstance.form.dureeMinutes).toBe('150');
    });


    it('should navigate back to the list on cancel', () => {
        const fixture = TestBed.createComponent(ExcursionFormPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onCancel();

        expect(navigate).toHaveBeenCalledWith(TestBed.inject(GlobalService).pages.adminExcursions);
    });
});
