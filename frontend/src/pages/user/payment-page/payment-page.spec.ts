import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_PAYMENT } from '../../../models/kz_payment.interface';
import { DEFAULT_KZ_RESERVATION, KzReservation } from '../../../models/kz_reservation.interface';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { PaymentPage } from './payment-page';


const RESERVATION: KzReservation = {
    ...DEFAULT_KZ_RESERVATION,
    id: 9,
    reference: 'REF-9',
    quantity: 2,
    totalAmount: 300,
};

const CARD = {
    cardHolder: 'Kamal',
    cardNumber: '4242 4242 4242 4242',
    expiration: '12/28',
    cvv: '123',
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('PaymentPage', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [PaymentPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should expose the booking summary only when a booking is pending', () => {
        const fixture = TestBed.createComponent(PaymentPage);
        fixture.detectChanges();

        expect(fixture.componentInstance.hasReservation).toBe(false);

        TestBed.inject(AuthService).savePendingReservation(RESERVATION);
        fixture.componentInstance.ngOnInit();

        expect(fixture.componentInstance.hasReservation).toBe(true);
        expect(fixture.componentInstance.reservation.reference).toBe('REF-9');
    });


    it('should validate every card field before paying', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(PaymentPage);
        fixture.componentInstance.reservation = RESERVATION;

        await fixture.componentInstance.onPay();

        expect(fixture.componentInstance.errors.cardHolder).toBeTruthy();
        expect(fixture.componentInstance.errors.cardNumber).toBeTruthy();
        expect(fixture.componentInstance.errors.expiration).toBeTruthy();
        expect(fixture.componentInstance.errors.cvv).toBeTruthy();
        expect(fetchMock).not.toHaveBeenCalled();
    });


    it('should pay and clear the pending booking', async () => {
        TestBed.inject(AuthService).savePendingReservation(RESERVATION);
        const fetchMock = vi.fn().mockResolvedValue(response({
            data: { ...DEFAULT_KZ_PAYMENT, id: 1, reservationId: 9 },
        }));
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(PaymentPage);
        fixture.detectChanges();
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
        fixture.componentInstance.onHolderChange(CARD.cardHolder);
        fixture.componentInstance.onNumberChange(CARD.cardNumber);
        fixture.componentInstance.onExpirationChange(CARD.expiration);
        fixture.componentInstance.onCvvChange(CARD.cvv);

        await fixture.componentInstance.onPay();

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(navigate).toHaveBeenCalledWith(TestBed.inject(GlobalService).pages.reservations);
        expect(sessionStorage.getItem('kz_pending_reservation')).toBeNull();
        expect(fixture.componentInstance.isPaying).toBe(false);
    });


    it('should show the declined message on a payment decline', async () => {
        TestBed.inject(AuthService).savePendingReservation(RESERVATION);
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            error: { code: 'PAYMENT_DECLINED', message: 'Declined.' },
        }, 402)));
        const fixture = TestBed.createComponent(PaymentPage);
        fixture.detectChanges();
        fixture.componentInstance.onHolderChange(CARD.cardHolder);
        fixture.componentInstance.onNumberChange(CARD.cardNumber);
        fixture.componentInstance.onExpirationChange(CARD.expiration);
        fixture.componentInstance.onCvvChange(CARD.cvv);

        await fixture.componentInstance.onPay();

        expect(fixture.componentInstance.errorMessage).toBe(fixture.componentInstance.DECLINED_MESSAGE);
    });


    it('should navigate to the reservations from the back button', () => {
        const fixture = TestBed.createComponent(PaymentPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.goToReservations();

        expect(navigate).toHaveBeenCalledWith(TestBed.inject(GlobalService).pages.reservations);
    });
});
