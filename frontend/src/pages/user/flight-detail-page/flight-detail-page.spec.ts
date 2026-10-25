import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_FLIGHT, KzFlight } from '../../../models/kz_flight.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { ItemDetailService } from '../../../services/item-detail.service';
import { FlightDetailPage } from './flight-detail-page';


const FLIGHT: KzFlight = {
    ...DEFAULT_KZ_FLIGHT,
    id: 1,
    airline: 'Royal Air Maroc',
    flightNumber: 'AT100',
    departureCity: 'Casablanca',
    arrivalCity: 'Paris',
    departureTime: '2099-11-04T09:00:00',
    arrivalTime: '2099-11-04T12:30:00',
    totalSeats: 120,
    availableSeats: 4,
    price: 1200,
    active: true,
};

const load = vi.fn();
const reserve = vi.fn();


function setupLoad(result: unknown): void {
    load.mockResolvedValue(result);
}


describe('FlightDetailPage', () => {
    beforeEach(async () => {
        load.mockReset();
        reserve.mockReset();
        await TestBed.configureTestingModule({
            imports: [FlightDetailPage],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
                },
                { provide: ItemDetailService, useValue: { load, reserve } },
            ],
        }).compileComponents();
    });


    it('should load the flight and build its detail', async () => {
        setupLoad({ item: FLIGHT, error: '', signedOut: false });
        const fixture = TestBed.createComponent(FlightDetailPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.item?.flightNumber).toBe('AT100');
        expect(fixture.componentInstance.detail?.title).toBe('Casablanca - Paris');
        expect(fixture.componentInstance.detail?.rows.some((row) => row.value === '3h 30min')).toBe(true);
        expect(fixture.componentInstance.isLoading).toBe(false);
    });


    it('should show the empty message when the flight does not exist', async () => {
        setupLoad({ item: null, error: '', signedOut: false });
        const fixture = TestBed.createComponent(FlightDetailPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.errorMessage).toBe(KZ_LABELS.noResult);
        expect(fixture.componentInstance.isLoading).toBe(false);
    });


    it('should clamp the quantity to the available seats', async () => {
        setupLoad({ item: FLIGHT, error: '', signedOut: false });
        const fixture = TestBed.createComponent(FlightDetailPage);
        fixture.detectChanges();
        await fixture.whenStable();

        fixture.componentInstance.onQuantityChanged(9);

        expect(fixture.componentInstance.quantity).toBe(4);
    });


    it('should reserve the flight and navigate to the payment', async () => {
        setupLoad({ item: FLIGHT, error: '', signedOut: false });
        reserve.mockResolvedValue({ path: '/payment', error: '', signedOut: false });
        const fixture = TestBed.createComponent(FlightDetailPage);
        fixture.detectChanges();
        await fixture.whenStable();
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        await fixture.componentInstance.onReserve();

        expect(reserve).toHaveBeenCalledWith(KzItemType.FLIGHT, 1, 1);
        expect(navigate).toHaveBeenCalledWith('/payment');
        expect(fixture.componentInstance.isReserving).toBe(false);
    });


    it('should disable the booking of a flight whose start date has passed', async () => {
        const pastFlight = {
            ...FLIGHT,
            departureTime: '2020-01-01T09:00:00',
            arrivalTime: '2020-01-01T12:30:00',
        };
        setupLoad({ item: pastFlight, error: '', signedOut: false });
        const fixture = TestBed.createComponent(FlightDetailPage);
        fixture.detectChanges();
        await fixture.whenStable();

        await fixture.componentInstance.onReserve();

        expect(fixture.componentInstance.detail?.disabled).toBe(true);
        expect(fixture.componentInstance.detail?.disabledLabel).toBe('Expired');
        expect(reserve).not.toHaveBeenCalled();
    });


    it('should show the reservation error', async () => {
        setupLoad({ item: FLIGHT, error: '', signedOut: false });
        reserve.mockResolvedValue({ path: '', error: 'Not enough seats.', signedOut: false });
        const fixture = TestBed.createComponent(FlightDetailPage);
        fixture.detectChanges();
        await fixture.whenStable();
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        await fixture.componentInstance.onReserve();

        expect(fixture.componentInstance.errorMessage).toBe('Not enough seats.');
        expect(navigate).not.toHaveBeenCalled();
    });
});
