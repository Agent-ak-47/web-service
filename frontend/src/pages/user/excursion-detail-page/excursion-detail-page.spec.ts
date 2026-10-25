import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_EXCURSION, KzExcursion } from '../../../models/kz_excursion.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { ItemDetailService } from '../../../services/item-detail.service';
import { ExcursionDetailPage } from './excursion-detail-page';


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

const load = vi.fn();
const reserve = vi.fn();


describe('ExcursionDetailPage', () => {
    beforeEach(async () => {
        load.mockReset();
        reserve.mockReset();
        await TestBed.configureTestingModule({
            imports: [ExcursionDetailPage],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } },
                },
                { provide: ItemDetailService, useValue: { load, reserve } },
            ],
        }).compileComponents();
    });


    it('should load the excursion and format its duration', async () => {
        load.mockResolvedValue({ item: EXCURSION, error: '', signedOut: false });
        const fixture = TestBed.createComponent(ExcursionDetailPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.detail?.title).toBe('Medina walking tour');
        expect(fixture.componentInstance.detail?.rows.some((row) => row.value === '2h 30min')).toBe(true);
    });


    it('should show the empty message when the excursion does not exist', async () => {
        load.mockResolvedValue({ item: null, error: '', signedOut: false });
        const fixture = TestBed.createComponent(ExcursionDetailPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.errorMessage).toBe(KZ_LABELS.noResult);
    });


    it('should reserve the excursion and navigate to the payment', async () => {
        load.mockResolvedValue({ item: EXCURSION, error: '', signedOut: false });
        reserve.mockResolvedValue({ path: '/payment', error: '', signedOut: false });
        const fixture = TestBed.createComponent(ExcursionDetailPage);
        fixture.detectChanges();
        await fixture.whenStable();
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        await fixture.componentInstance.onReserve();

        expect(reserve).toHaveBeenCalledWith(KzItemType.EXCURSION, 3, 1);
        expect(navigate).toHaveBeenCalledWith('/payment');
    });
});
