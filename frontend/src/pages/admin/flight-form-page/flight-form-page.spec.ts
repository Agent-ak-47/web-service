import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_FLIGHT, KzFlight } from '../../../models/kz_flight.interface';
import { GlobalService } from '../../../services/global.service';
import { ItemDetailService } from '../../../services/item-detail.service';
import { FlightFormPage } from './flight-form-page';


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
};

const VALID = {
    airline: 'Royal Air Maroc',
    flightNumber: 'AT100',
    departureCity: 'Casablanca',
    arrivalCity: 'Paris',
    totalSeats: '120',
    availableSeats: '10',
    price: '1200',
};

let routeId = '';
const load = vi.fn();


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('FlightFormPage', () => {
    beforeEach(async () => {
        routeId = '';
        load.mockReset();
        await TestBed.configureTestingModule({
            imports: [FlightFormPage],
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
        const fixture = TestBed.createComponent(FlightFormPage);
        fixture.detectChanges();

        expect(fixture.componentInstance.isEditing).toBe(false);
        expect(fixture.componentInstance.formTitle).toBe(fixture.componentInstance.CREATE_TITLE);
        expect(fixture.componentInstance.sections.length).toBe(6);
        expect(fixture.componentInstance.isLoading).toBe(false);
    });


    it('should validate the required fields before saving', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(FlightFormPage);
        fixture.detectChanges();

        await fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.errors.airline).toBe(fixture.componentInstance.AIRLINE_ERROR);
        expect(fixture.componentInstance.errors.totalSeats).toBe(fixture.componentInstance.TOTAL_SEATS_ERROR);
        expect(fixture.componentInstance.errors.price).toBe(fixture.componentInstance.PRICE_ERROR);
        expect(fetchMock).not.toHaveBeenCalled();
    });


    it('should clear a field error and mark the form dirty when a field changes', () => {
        const fixture = TestBed.createComponent(FlightFormPage);
        fixture.componentInstance.errors.airline = 'required';

        fixture.componentInstance.onFieldChange({ name: 'airline', value: 'RAM' });

        expect(fixture.componentInstance.form.airline).toBe('RAM');
        expect(fixture.componentInstance.errors.airline).toBe('');
        expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
    });


    it('should toggle the active state', () => {
        const fixture = TestBed.createComponent(FlightFormPage);

        fixture.componentInstance.onToggleActive();

        expect(fixture.componentInstance.form.active).toBe(false);
        expect(fixture.componentInstance.activeLabel).toBe(fixture.componentInstance.INACTIVE_LABEL);
    });


    it('should save a new flight and navigate to the list', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: FLIGHT })));
        const fixture = TestBed.createComponent(FlightFormPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        for (const [name, value] of Object.entries(VALID)) {
            fixture.componentInstance.onFieldChange({ name, value });
        }
        await fixture.componentInstance.onSubmit();

        expect(navigate).toHaveBeenCalledWith(TestBed.inject(GlobalService).pages.adminFlights);
        expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
    });


    it('should load the flight being edited', async () => {
        routeId = '1';
        load.mockResolvedValue({ item: FLIGHT, error: '', signedOut: false });
        const fixture = TestBed.createComponent(FlightFormPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.isEditing).toBe(true);
        expect(fixture.componentInstance.formTitle).toBe(fixture.componentInstance.EDIT_TITLE);
        expect(fixture.componentInstance.form.flightNumber).toBe('AT100');
        expect(fixture.componentInstance.form.totalSeats).toBe('120');
    });


    it('should tolerate a flight without times when editing', async () => {
        routeId = '1';
        const legacy = { ...FLIGHT, departureTime: undefined, arrivalTime: undefined } as unknown as KzFlight;
        load.mockResolvedValue({ item: legacy, error: '', signedOut: false });
        const fixture = TestBed.createComponent(FlightFormPage);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.isLoading).toBe(false);
        expect(fixture.componentInstance.form.departureTime).toBe('');
        expect(fixture.componentInstance.form.arrivalTime).toBe('');
    });


    it('should navigate back to the list on cancel', () => {
        const fixture = TestBed.createComponent(FlightFormPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onCancel();

        expect(navigate).toHaveBeenCalledWith(TestBed.inject(GlobalService).pages.adminFlights);
    });
});
