import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzPayment } from '../../../models/kz_payment.interface';
import { KzPaymentMethod } from '../../../models/kz_payment_method.enum';
import { DEFAULT_KZ_RESERVATION, KzReservation } from '../../../models/kz_reservation.interface';
import { parseItem, parseResponse } from '../../../models/kz_response';
import { KzMoneyPipe } from '../../../pipes/kz-money.pipe';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzBtn } from '../../../components/kz-btn/kz-btn';
import { KzField } from '../../../components/kz-field/kz-field';
import { DEFAULT_KZ_CARD_FORM, KzCardForm } from './models/kz_card_form.interface';
import { DEFAULT_KZ_FORM_ERRORS, KzFormErrors } from './models/kz_form_errors.interface';


@Component({
    selector: 'kz-payment-page',
    standalone: true,
    imports: [KzBtn, KzField, KzMoneyPipe],
    templateUrl: './payment-page.html',
    styleUrl: './payment-page.css',
})
export class PaymentPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Payment';
    readonly PAGE_SUBTITLE = 'Pay for your booking by credit card.';
    readonly CARD_TITLE = 'Credit card';
    readonly CARD_HINT = 'Card details are never stored, they are cleared after the payment.';
    readonly HOLDER_LABEL = 'Card holder';
    readonly NUMBER_LABEL = 'Card number';
    readonly EXPIRATION_LABEL = 'Expires';
    readonly CVV_LABEL = 'CVV';
    readonly NUMBER_PLACEHOLDER = '4242 4242 4242 4242';
    readonly EXPIRATION_PLACEHOLDER = '12/28';
    readonly CVV_PLACEHOLDER = '123';
    readonly HOLDER_ERROR = 'The card holder is required.';
    readonly NUMBER_ERROR = 'The card number must contain at least 12 digits.';
    readonly EXPIRATION_ERROR = 'The expiry date must follow the MM/YY format.';
    readonly CVV_ERROR = 'The CVV must contain 3 digits.';
    readonly SUMMARY_TITLE = 'Summary';
    readonly REFERENCE_LABEL = 'Reference';
    readonly ITEM_LABEL = 'Item';
    readonly QUANTITY_LABEL = KZ_LABELS.quantity;
    readonly UNIT_PRICE_LABEL = KZ_LABELS.unitPrice;
    readonly TOTAL_LABEL = KZ_LABELS.total;
    readonly EMPTY_MESSAGE = 'No booking to pay for now.';
    readonly BACK_LABEL = KZ_LABELS.back;
    readonly PAY_LABEL = 'Pay';
    readonly PAY_LOADING_LABEL = KZ_LABELS.paying;
    readonly DECLINED_MESSAGE = 'Payment declined by the bank. Check the details and try again.';
    readonly TEXT_TYPE = KzFieldType.TEXT;
    readonly PASSWORD_TYPE = KzFieldType.PASSWORD;
    readonly MIN_CARD_DIGITS = 12;
    readonly DECLINED_STATUS = 402;
    readonly DECLINED_CODE = 'PAYMENT_DECLINED';
    readonly EXPIRATION_PATTERN = /^(0[1-9]|1[0-2])\/\d{2}$/;
    readonly CVV_PATTERN = /^\d{3}$/;
    readonly SPACES_PATTERN = /\s/g;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    reservation: KzReservation = { ...DEFAULT_KZ_RESERVATION };
    form: KzCardForm = { ...DEFAULT_KZ_CARD_FORM };
    errors: KzFormErrors = { ...DEFAULT_KZ_FORM_ERRORS };
    isPaying = false;
    isSubmitted = false;
    errorMessage = '';


    get hasReservation(): boolean {
        return this.reservation.id !== 0;
    }


    get payLabel(): string {
        return this.isPaying ? this.PAY_LOADING_LABEL : this.PAY_LABEL;
    }


    get hasErrors(): boolean {
        return Object.values(this.errors).some((message: string) => message.length > 0);
    }


    ngOnInit(): void {
        this.reservation = this.authService.pendingReservation;
    }


    hasUnsavedChanges(): boolean {
        const { cardHolder, cardNumber, expiration, cvv } = this.form;
        const isFilled = cardHolder.trim().length > 0
            || cardNumber.trim().length > 0
            || expiration.trim().length > 0
            || cvv.trim().length > 0;

        return isFilled && !this.isSubmitted;
    }


    onHolderChange(value: string): void {
        this.form.cardHolder = value;
        this.errors.cardHolder = '';
    }


    onNumberChange(value: string): void {
        this.form.cardNumber = value;
        this.errors.cardNumber = '';
    }


    onExpirationChange(value: string): void {
        this.form.expiration = value;
        this.errors.expiration = '';
    }


    onCvvChange(value: string): void {
        this.form.cvv = value;
        this.errors.cvv = '';
    }


    async onPay(): Promise<void> {
        if (this.isPaying) {
            return;
        }

        this.errorMessage = '';
        this.errors = this.buildErrors();

        if (this.hasErrors) {
            return;
        }

        await this.pay();
    }


    goToReservations(): void {
        this.router.navigateByUrl(this.globalService.pages.reservations);
    }


    private async pay(): Promise<void> {
        this.isPaying = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.reservationPayment(this.reservation.id), {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify({
                    method: KzPaymentMethod.CARD,
                    cardNumber: this.form.cardNumber.replace(this.SPACES_PATTERN, ''),
                    expiration: this.form.expiration.trim(),
                    cvv: this.form.cvv.trim(),
                }),
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzPayment>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.resetCard();
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = this.isDeclined(response.status, parsed.error.code)
                    ? this.DECLINED_MESSAGE
                    : parsed.error.message;

                return;
            }

            const payment = parseItem<KzPayment>(parsed.data);

            if (payment === null) {
                this.errorMessage = KZ_LABELS.unexpectedError;

                return;
            }

            this.resetCard();
            this.authService.clearPendingReservation();
            this.router.navigateByUrl(this.globalService.pages.reservations);
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isPaying = false;
        }
    }


    private buildErrors(): KzFormErrors {
        const errors: KzFormErrors = { ...DEFAULT_KZ_FORM_ERRORS };
        const digits = this.form.cardNumber.replace(this.SPACES_PATTERN, '');

        if (this.form.cardHolder.trim().length === 0) {
            errors.cardHolder = this.HOLDER_ERROR;
        }

        if (digits.length < this.MIN_CARD_DIGITS) {
            errors.cardNumber = this.NUMBER_ERROR;
        }

        if (!this.EXPIRATION_PATTERN.test(this.form.expiration.trim())) {
            errors.expiration = this.EXPIRATION_ERROR;
        }

        if (!this.CVV_PATTERN.test(this.form.cvv.trim())) {
            errors.cvv = this.CVV_ERROR;
        }

        return errors;
    }


    private resetCard(): void {
        this.isSubmitted = true;
        this.form = { ...DEFAULT_KZ_CARD_FORM };
        this.errors = { ...DEFAULT_KZ_FORM_ERRORS };
    }


    private isDeclined(status: number, code: string): boolean {
        return status === this.DECLINED_STATUS || code === this.DECLINED_CODE;
    }
}