import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_EXCURSION } from '../../../models/kz_excursion.interface';
import { DEFAULT_KZ_FLIGHT } from '../../../models/kz_flight.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { DEFAULT_KZ_PACKAGE, KzPackage } from '../../../models/kz_package.interface';
import { ItemDetailService } from '../../../services/item-detail.service';
import { PackageDetailPage } from './package-detail-page';


const PACKAGE: KzPackage = {
    ...DEFAULT_KZ_PACKAGE,
    id: 2,
    name: 'Marrakech Escape',
    destination: 'Marrakech',
    startDate: '2099-12-01',
    endDate: '2099-12-05',
    durationNights: 4,
    price: 2000,
    promoPrice: 1500,
    discountPercentage: 25,
    available: true,
    composition: {
        flights: [{ ...DEFAULT_KZ_FLIGHT, id: 1, flightNumber: 'AT100' }],
        excursions: [{ ...DEFAULT_KZ_EXCURSION, id: 1, title: 'Medina tour' }],
    },
};

const load = vi.fn();
const reserve = vi.fn();


describe('PackageDetailPage', () => {
    beforeEach(async () => {
        load.mockReset();
        reserve.mockReset();
        await TestBed.configureTestingModule({
            imports: [PackageDetailPage],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({ id: '2' }) } },
                },
                { provide: ItemDetailService, useValue: { load, reserve } },
            ],
        }).compileComponents();
    });


    it('should load the package and build its composition', async () => {
        load.mockResolvedValue({ item: PACKAGE, error: '', signedOut: false });
        const fixture = TestBed.createComponent(PackageDetailPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.detail?.title).toBe('Marrakech Escape');
        expect(fixture.componentInstance.detail?.price).toBe(1500);
        expect(fixture.componentInstance.detail?.sections.length).toBe(2);
        expect(fixture.componentInstance.detail?.sections[0].rows.length).toBe(1);
    });


    it('should calculate the nights from the start and end dates', async () => {
        load.mockResolvedValue({
            item: { ...PACKAGE, startDate: '2099-12-01', endDate: '2099-12-06', durationNights: 99 },
            error: '',
            signedOut: false,
        });
        const fixture = TestBed.createComponent(PackageDetailPage);

        fixture.detectChanges();
        await fixture.whenStable();

        const nights = fixture.componentInstance.detail?.rows.find(
            (row) => row.label === fixture.componentInstance.NIGHTS_LABEL,
        );
        expect(nights?.value).toBe('5');
    });


    it('should show the empty message when the package does not exist', async () => {
        load.mockResolvedValue({ item: null, error: '', signedOut: false });
        const fixture = TestBed.createComponent(PackageDetailPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.errorMessage).toBe(KZ_LABELS.noResult);
    });


    it('should disable the booking of an unavailable package', async () => {
        load.mockResolvedValue({ item: { ...PACKAGE, available: false }, error: '', signedOut: false });
        const fixture = TestBed.createComponent(PackageDetailPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.detail?.disabled).toBe(true);
        expect(fixture.componentInstance.detail?.disabledLabel).toBe('Booked');
    });


    it('should disable the booking of a package whose start date has passed', async () => {
        const pastPackage = { ...PACKAGE, startDate: '2020-01-01', endDate: '2020-01-05' };
        load.mockResolvedValue({ item: pastPackage, error: '', signedOut: false });
        const fixture = TestBed.createComponent(PackageDetailPage);
        fixture.detectChanges();
        await fixture.whenStable();

        await fixture.componentInstance.onReserve();

        expect(fixture.componentInstance.detail?.disabled).toBe(true);
        expect(fixture.componentInstance.detail?.disabledLabel).toBe('Expired');
        expect(reserve).not.toHaveBeenCalled();
    });


    it('should redirect the reservation to sign in when signed out', async () => {
        load.mockResolvedValue({ item: PACKAGE, error: '', signedOut: false });
        reserve.mockResolvedValue({ path: '/sign-in', error: '', signedOut: true });
        const fixture = TestBed.createComponent(PackageDetailPage);
        fixture.detectChanges();
        await fixture.whenStable();
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        await fixture.componentInstance.onReserve();

        expect(navigate).toHaveBeenCalledWith('/sign-in');
    });
});
