import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_PACKAGE, KzPackage } from '../../../models/kz_package.interface';
import { GlobalService } from '../../../services/global.service';
import { ItemDetailService } from '../../../services/item-detail.service';
import { PackageFormPage } from './package-form-page';


const PACKAGE: KzPackage = {
    ...DEFAULT_KZ_PACKAGE,
    id: 2,
    name: 'Marrakech Escape',
    destination: 'Marrakech',
    durationNights: 4,
    price: 2000,
    startDate: '2026-12-01',
    endDate: '2026-12-05',
    discountPercentage: 25,
};

const VALID = {
    name: 'Marrakech Escape',
    destination: 'Marrakech',
    durationNights: '4',
    price: '2000',
    discountPercentage: '10',
};

let routeId = '';
const load = vi.fn();


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('PackageFormPage', () => {
    beforeEach(async () => {
        routeId = '';
        load.mockReset();
        await TestBed.configureTestingModule({
            imports: [PackageFormPage],
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
        const fixture = TestBed.createComponent(PackageFormPage);
        fixture.detectChanges();

        expect(fixture.componentInstance.isEditing).toBe(false);
        expect(fixture.componentInstance.formTitle).toBe(fixture.componentInstance.CREATE_TITLE);
        expect(fixture.componentInstance.sections.length).toBe(5);
    });


    it('should validate the name, destination, nights, price and discount', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(PackageFormPage);

        fixture.componentInstance.onFieldChange({ name: 'discountPercentage', value: '150' });
        await fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.errors.name).toBe(fixture.componentInstance.NAME_ERROR);
        expect(fixture.componentInstance.errors.destination).toBe(fixture.componentInstance.DESTINATION_ERROR);
        expect(fixture.componentInstance.errors.durationNights).toBe(fixture.componentInstance.DURATION_ERROR);
        expect(fixture.componentInstance.errors.price).toBe(fixture.componentInstance.PRICE_ERROR);
        expect(fixture.componentInstance.errors.discountPercentage).toBe(fixture.componentInstance.DISCOUNT_ERROR);
        expect(fetchMock).not.toHaveBeenCalled();
    });


    it('should clear a field error and mark the form dirty when a field changes', () => {
        const fixture = TestBed.createComponent(PackageFormPage);
        fixture.componentInstance.errors.name = 'required';

        fixture.componentInstance.onFieldChange({ name: 'name', value: 'Marrakech Escape' });

        expect(fixture.componentInstance.form.name).toBe('Marrakech Escape');
        expect(fixture.componentInstance.errors.name).toBe('');
        expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
    });


    it('should save a new package and navigate to the list', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: PACKAGE })));
        const fixture = TestBed.createComponent(PackageFormPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        for (const [name, value] of Object.entries(VALID)) {
            fixture.componentInstance.onFieldChange({ name, value });
        }
        await fixture.componentInstance.onSubmit();

        expect(navigate).toHaveBeenCalledWith(TestBed.inject(GlobalService).pages.adminPackages);
        expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
    });


    it('should load the package being edited', async () => {
        routeId = '2';
        load.mockResolvedValue({ item: PACKAGE, error: '', signedOut: false });
        const fixture = TestBed.createComponent(PackageFormPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.isEditing).toBe(true);
        expect(fixture.componentInstance.form.name).toBe('Marrakech Escape');
        expect(fixture.componentInstance.form.startDate).toBe('2026-12-01');
    });


    it('should navigate back to the list on cancel', () => {
        const fixture = TestBed.createComponent(PackageFormPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onCancel();

        expect(navigate).toHaveBeenCalledWith(TestBed.inject(GlobalService).pages.adminPackages);
    });
});
