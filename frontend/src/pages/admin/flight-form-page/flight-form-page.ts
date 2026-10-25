import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFlight } from '../../../models/kz_flight.interface';
import {
    DEFAULT_KZ_FLIGHT_FORM,
    DEFAULT_KZ_FLIGHT_FORM_ERRORS,
    KzFlightForm,
    KzFlightFormErrors,
} from '../../../models/kz_flight_form.interface';
import { KzFormColumns } from '../../../models/kz_form_columns.enum';
import { DEFAULT_KZ_FORM_FIELD, KzFormField } from '../../../models/kz_form_field.interface';
import { KzFormFieldChange } from '../../../models/kz_form_field_change.interface';
import { KzFormSection } from '../../../models/kz_form_section.interface';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { parseResponse } from '../../../models/kz_response';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { ItemDetailService } from '../../../services/item-detail.service';
import { KzErrorPopup } from '../../../components/kz-error-popup/kz-error-popup';
import { KzFormPanel } from '../../../components/kz-form-panel/kz-form-panel';
import { KzLoading } from '../../../components/kz-loading/kz-loading';


@Component({
    selector: 'kz-flight-form-page',
    standalone: true,
    imports: [KzErrorPopup, KzFormPanel, KzLoading],
    templateUrl: './flight-form-page.html',
    styleUrl: './flight-form-page.css',
})
export class FlightFormPage implements KzGuardedForm, OnInit {
    readonly PAGE_SUBTITLE = 'Create or edit a flight from the catalog.';
    readonly CREATE_TITLE = 'New flight';
    readonly EDIT_TITLE = 'Edit the flight';
    readonly VALIDATION_LABEL = 'Fix the fields in error before saving.';
    readonly LOADING_LABEL = KZ_LABELS.loading;
    readonly ACTIVE_LABEL = 'Active';
    readonly INACTIVE_LABEL = 'Inactive';
    readonly IDENTITY_SECTION = 'identity';
    readonly MEDIA_SECTION = 'media';
    readonly ROUTE_SECTION = 'route';
    readonly TIMES_SECTION = 'times';
    readonly SEATS_SECTION = 'seats';
    readonly TARIFF_SECTION = 'tariff';
    readonly IDENTITY_TITLE = 'Airline';
    readonly MEDIA_TITLE = 'Cover';
    readonly ROUTE_TITLE = 'Route';
    readonly TIMES_TITLE = 'Times';
    readonly SEATS_TITLE = 'Seats';
    readonly TARIFF_TITLE = 'Price';
    readonly AIRLINE_LABEL = 'Airline';
    readonly FLIGHT_NUMBER_LABEL = 'Number';
    readonly DEPARTURE_CITY_LABEL = 'Departure city';
    readonly ARRIVAL_CITY_LABEL = 'Arrival city';
    readonly DEPARTURE_TIME_LABEL = 'Departure date';
    readonly ARRIVAL_TIME_LABEL = 'Arrival date';
    readonly TOTAL_SEATS_LABEL = 'Total seats';
    readonly AVAILABLE_SEATS_LABEL = 'Available seats';
    readonly PRICE_LABEL = 'Price';
    readonly IMAGE_LABEL = 'Image';
    readonly AIRLINE_ERROR = 'The airline is required.';
    readonly FLIGHT_NUMBER_ERROR = 'The flight number is required.';
    readonly DEPARTURE_CITY_ERROR = 'The departure city is required.';
    readonly ARRIVAL_CITY_ERROR = 'The arrival city is required.';
    readonly TOTAL_SEATS_ERROR = 'Enter at least one seat.';
    readonly AVAILABLE_SEATS_ERROR = 'Available seats cannot exceed the total.';
    readonly PRICE_ERROR = 'The price must be greater than zero.';
    readonly SEATS_MIN = '1';
    readonly FREE_MIN = '0';
    readonly PRICE_MIN = '0';
    readonly PRICE_STEP = '0.01';
    readonly DATE_LENGTH = 10;
    readonly ON_KIND = KzBtnKind.PRIMARY;
    readonly OFF_KIND = KzBtnKind.SECONDARY;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly detailService = inject(ItemDetailService);

    form: KzFlightForm = { ...DEFAULT_KZ_FLIGHT_FORM };
    errors: KzFlightFormErrors = { ...DEFAULT_KZ_FLIGHT_FORM_ERRORS };
    editingId = 0;
    isLoading = true;
    isSaving = false;
    isDirty = false;
    errorMessage = '';


    get isEditing(): boolean {
        return this.editingId !== 0;
    }


    get formTitle(): string {
        return this.isEditing ? this.EDIT_TITLE : this.CREATE_TITLE;
    }


    get activeLabel(): string {
        return this.form.active ? this.ACTIVE_LABEL : this.INACTIVE_LABEL;
    }


    get activeKind(): KzBtnKind {
        return this.form.active ? this.ON_KIND : this.OFF_KIND;
    }


    get hasFormErrors(): boolean {
        return Object.values(this.errors).some((message: string) => message.length > 0);
    }


    get validationMessage(): string {
        return this.hasFormErrors ? this.VALIDATION_LABEL : '';
    }


    get sections(): KzFormSection[] {
        return [
            {
                id: this.MEDIA_SECTION,
                title: this.MEDIA_TITLE,
                columns: KzFormColumns.ONE,
                fields: [
                    this.formField({
                        name: 'imageUrl',
                        label: this.IMAGE_LABEL,
                        type: KzFieldType.IMAGE,
                        value: this.form.imageUrl,
                    }),
                ],
            },
            {
                id: this.IDENTITY_SECTION,
                title: this.IDENTITY_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'airline',
                        label: this.AIRLINE_LABEL,
                        value: this.form.airline,
                        error: this.errors.airline,
                        required: true,
                    }),
                    this.formField({
                        name: 'flightNumber',
                        label: this.FLIGHT_NUMBER_LABEL,
                        value: this.form.flightNumber,
                        error: this.errors.flightNumber,
                        required: true,
                    }),
                ],
            },
            {
                id: this.ROUTE_SECTION,
                title: this.ROUTE_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'departureCity',
                        label: this.DEPARTURE_CITY_LABEL,
                        value: this.form.departureCity,
                        error: this.errors.departureCity,
                        required: true,
                    }),
                    this.formField({
                        name: 'arrivalCity',
                        label: this.ARRIVAL_CITY_LABEL,
                        value: this.form.arrivalCity,
                        error: this.errors.arrivalCity,
                        required: true,
                    }),
                ],
            },
            {
                id: this.TIMES_SECTION,
                title: this.TIMES_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'departureTime',
                        label: this.DEPARTURE_TIME_LABEL,
                        type: KzFieldType.DATE,
                        value: this.form.departureTime,
                    }),
                    this.formField({
                        name: 'arrivalTime',
                        label: this.ARRIVAL_TIME_LABEL,
                        type: KzFieldType.DATE,
                        value: this.form.arrivalTime,
                    }),
                ],
            },
            {
                id: this.SEATS_SECTION,
                title: this.SEATS_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'totalSeats',
                        label: this.TOTAL_SEATS_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.totalSeats,
                        min: this.SEATS_MIN,
                        error: this.errors.totalSeats,
                        required: true,
                    }),
                    this.formField({
                        name: 'availableSeats',
                        label: this.AVAILABLE_SEATS_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.availableSeats,
                        min: this.FREE_MIN,
                        error: this.errors.availableSeats,
                        required: true,
                    }),
                ],
            },
            {
                id: this.TARIFF_SECTION,
                title: this.TARIFF_TITLE,
                columns: KzFormColumns.ONE,
                fields: [
                    this.formField({
                        name: 'price',
                        label: this.PRICE_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.price,
                        min: this.PRICE_MIN,
                        step: this.PRICE_STEP,
                        error: this.errors.price,
                        required: true,
                    }),
                ],
            },
        ];
    }


    ngOnInit(): void {
        this.load();
    }


    hasUnsavedChanges(): boolean {
        return this.isDirty;
    }


    onFieldChange(change: KzFormFieldChange): void {
        this.form = { ...this.form, [change.name]: change.value } as KzFlightForm;
        this.errors = { ...this.errors, [change.name]: '' };
        this.isDirty = true;
    }


    onToggleActive(): void {
        this.form.active = !this.form.active;
        this.isDirty = true;
    }


    onCancel(): void {
        this.router.navigateByUrl(this.globalService.pages.adminFlights);
    }


    async onSubmit(): Promise<void> {
        if (this.isSaving) {
            return;
        }

        this.errors = this.buildErrors();

        if (this.hasFormErrors) {
            return;
        }

        await this.save();
    }


    private async load(): Promise<void> {
        const id = Number(this.route.snapshot.paramMap.get('id') ?? '0');

        if (id !== 0) {
            const result = await this.detailService.load<KzFlight>(this.globalService.routes.flight(id));

            if (result.signedOut) {
                this.router.navigateByUrl(this.globalService.pages.signIn);

                return;
            }

            if (result.item === null) {
                this.errorMessage = result.error.length > 0 ? result.error : KZ_LABELS.noResult;
            }
            else {
                this.startEdit(result.item);
            }
        }

        this.isLoading = false;
    }


    private async save(): Promise<void> {
        this.isSaving = true;
        this.errorMessage = '';

        try {
            const url = this.isEditing
                ? this.globalService.routes.flight(this.editingId)
                : this.globalService.routes.flights;

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify(this.form),
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzFlight>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            this.isDirty = false;
            this.router.navigateByUrl(this.globalService.pages.adminFlights);
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isSaving = false;
        }
    }


    private startEdit(flight: KzFlight): void {
        this.editingId = flight.id;
        this.form = {
            airline: flight.airline,
            flightNumber: flight.flightNumber,
            departureCity: flight.departureCity,
            arrivalCity: flight.arrivalCity,
            departureTime: (flight.departureTime ?? '').slice(0, this.DATE_LENGTH),
            arrivalTime: (flight.arrivalTime ?? '').slice(0, this.DATE_LENGTH),
            totalSeats: String(flight.totalSeats),
            availableSeats: String(flight.availableSeats),
            price: String(flight.price),
            imageUrl: flight.imageUrl,
            active: flight.active,
        };
        this.errors = { ...DEFAULT_KZ_FLIGHT_FORM_ERRORS };
        this.isDirty = false;
    }


    private formField(field: Partial<KzFormField>): KzFormField {
        return { ...DEFAULT_KZ_FORM_FIELD, disabled: this.isSaving, ...field };
    }


    private buildErrors(): KzFlightFormErrors {
        const errors: KzFlightFormErrors = { ...DEFAULT_KZ_FLIGHT_FORM_ERRORS };
        const totalSeats = Number(this.form.totalSeats);
        const availableSeats = Number(this.form.availableSeats);
        const price = Number(this.form.price);

        if (this.form.airline.trim().length === 0) {
            errors.airline = this.AIRLINE_ERROR;
        }

        if (this.form.flightNumber.trim().length === 0) {
            errors.flightNumber = this.FLIGHT_NUMBER_ERROR;
        }

        if (this.form.departureCity.trim().length === 0) {
            errors.departureCity = this.DEPARTURE_CITY_ERROR;
        }

        if (this.form.arrivalCity.trim().length === 0) {
            errors.arrivalCity = this.ARRIVAL_CITY_ERROR;
        }

        if (totalSeats < 1) {
            errors.totalSeats = this.TOTAL_SEATS_ERROR;
        }

        if (availableSeats < 0 || availableSeats > totalSeats) {
            errors.availableSeats = this.AVAILABLE_SEATS_ERROR;
        }

        if (price <= 0) {
            errors.price = this.PRICE_ERROR;
        }

        return errors;
    }
}
