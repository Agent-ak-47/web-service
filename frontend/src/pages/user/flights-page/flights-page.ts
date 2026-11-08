import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KzFlight } from '../../../models/kz_flight.interface';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzItemCardData } from '../../../models/kz_item_card_data.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { KzLabels } from '../../../models/kz_labels.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { addQuery, cleanQueryParams, KzQueryParams } from '../../../models/kz_query';
import { KzReservation } from '../../../models/kz_reservation.interface';
import { hasStartDatePassed } from '../../../models/kz_reservation_policy';
import { parseList, parseResponse } from '../../../models/kz_response';
import { KzTone } from '../../../models/kz_tone.enum';
import { KzDatePipe } from '../../../pipes/kz-date.pipe';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzCard } from '../../../components/kz-card/kz-card';
import { KzErrorPopup } from '../../../components/kz-error-popup/kz-error-popup';
import { KzFilterBar } from '../../../components/kz-filter-bar/kz-filter-bar';
import { KzLoading } from '../../../components/kz-loading/kz-loading';
import {
    DEFAULT_KZ_FLIGHT_FILTER,
    DEFAULT_KZ_FLIGHT_QUANTITY,
    KzFlightFilter,
} from './models/kz_flight_filter.interface';


@Component({
    selector: 'kz-flights-page',
    standalone: true,
    imports: [KzCard, KzErrorPopup, KzFilterBar, KzLoading],
    templateUrl: './flights-page.html',
    styleUrl: './flights-page.css',
})
export class FlightsPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Flights';
    readonly PAGE_SUBTITLE = 'Pick your flight and book your seat in a few clicks.';
    readonly DEPARTURE_LABEL = 'Departure city';
    readonly ARRIVAL_LABEL = 'Arrival city';
    readonly DATE_LABEL = 'Departure date';
    readonly MAX_PRICE_LABEL = 'Max price';
    readonly QUANTITY_LABEL = 'Seats';
    readonly DEPARTURE_PLACEHOLDER = 'Casablanca';
    readonly ARRIVAL_PLACEHOLDER = 'Paris';
    readonly RESERVE_LABEL = 'Book';
    readonly SOLD_OUT_LABEL = 'Booked';
    readonly EXPIRED_LABEL = 'Expired';
    readonly INACTIVE_LABEL = 'Unavailable';
    readonly PRICE_UNIT = 'per passenger';
    readonly DEPART_LABEL = 'Departure';
    readonly ARRIVAL_TIME_LABEL = 'Arrival';
    readonly COMPANY_LABEL = 'Airline';
    readonly NUMBER_LABEL = 'Number';
    readonly SEATS_LABEL = 'Seats';
    readonly EMPTY_LABEL = KZ_LABELS.noResult;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly datePipe = inject(KzDatePipe);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    flights: KzFlight[] = [];
    cards: KzItemCardData[] = [];
    filter: KzFlightFilter = { ...DEFAULT_KZ_FLIGHT_FILTER };
    isLoading = true;
    isReserving = false;
    reservingId = 0;
    errorMessage = '';
    filtersTouched = false;


    get labels(): KzLabels {
        return KZ_LABELS;
    }


    get filters(): KzFilterField[] {
        return [
            {
                name: 'departureCity',
                label: this.DEPARTURE_LABEL,
                type: KzFieldType.TEXT,
                value: this.filter.departureCity,
                placeholder: this.DEPARTURE_PLACEHOLDER,
                options: [],
            },
            {
                name: 'arrivalCity',
                label: this.ARRIVAL_LABEL,
                type: KzFieldType.TEXT,
                value: this.filter.arrivalCity,
                placeholder: this.ARRIVAL_PLACEHOLDER,
                options: [],
            },
            {
                name: 'departureDate',
                label: this.DATE_LABEL,
                type: KzFieldType.DATE,
                value: this.filter.departureDate,
                placeholder: '',
                options: [],
            },
            {
                name: 'maxPrice',
                label: this.MAX_PRICE_LABEL,
                type: KzFieldType.NUMBER,
                value: this.filter.maxPrice,
                placeholder: '',
                options: [],
            },
            {
                name: 'quantity',
                label: this.QUANTITY_LABEL,
                type: KzFieldType.NUMBER,
                value: this.filter.quantity,
                placeholder: '',
                options: [],
            },
        ];
    }


    get isEmpty(): boolean {
        return !this.isLoading && this.cards.length === 0;
    }


    ngOnInit(): void {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.applyQueryParams(params);
                void this.loadFlights();
            });
    }


    hasUnsavedChanges(): boolean {
        return this.filtersTouched;
    }


    onFiltersChanged(values: Record<string, string>): void {
        this.filtersTouched = true;
        this.applyFilters(values);
    }


    async onFiltersSubmitted(): Promise<void> {
        this.filtersTouched = false;
        await this.router.navigate([], {
            relativeTo: this.route,
            queryParams: this.queryParams(),
        });
    }


    async onFiltersReset(): Promise<void> {
        this.filter = { ...DEFAULT_KZ_FLIGHT_FILTER };
        await this.onFiltersSubmitted();
    }


    async loadFlights(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(addQuery(this.globalService.routes.flights, this.apiParams()), {
                method: 'GET',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<unknown>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            this.setFlights(parseList<KzFlight>(parsed.data));
            this.filtersTouched = false;
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isLoading = false;
        }
    }


    private applyFilters(values: Record<string, string>): void {
        this.filter = {
            departureCity: values['departureCity'] ?? this.filter.departureCity,
            arrivalCity: values['arrivalCity'] ?? this.filter.arrivalCity,
            departureDate: values['departureDate'] ?? this.filter.departureDate,
            maxPrice: values['maxPrice'] ?? this.filter.maxPrice,
            quantity: values['quantity'] ?? this.filter.quantity,
        };
    }


    private applyQueryParams(params: ParamMap): void {
        this.filter = {
            departureCity: params.get('departureCity') ?? '',
            arrivalCity: params.get('arrivalCity') ?? '',
            departureDate: params.get('departureDate') ?? '',
            maxPrice: params.get('maxPrice') ?? '',
            quantity: params.get('quantity') ?? String(DEFAULT_KZ_FLIGHT_QUANTITY),
        };
    }


    private queryParams(): KzQueryParams {
        const params = cleanQueryParams({
            departureCity: this.filter.departureCity,
            arrivalCity: this.filter.arrivalCity,
            departureDate: this.filter.departureDate,
            maxPrice: this.filter.maxPrice,
            quantity: this.filter.quantity,
        });

        if (params['quantity'] === String(DEFAULT_KZ_FLIGHT_QUANTITY)) {
            delete params['quantity'];
        }

        return params;
    }


    private apiParams(): KzQueryParams {
        return cleanQueryParams({
            departureCity: this.filter.departureCity,
            arrivalCity: this.filter.arrivalCity,
            departureDate: this.filter.departureDate,
            maxPrice: this.filter.maxPrice,
        });
    }


    onOpen(card: KzItemCardData): void {
        this.router.navigateByUrl(this.globalService.pages.flightDetail(card.id));
    }


    onReserve(card: KzItemCardData): void {
        if (!this.authService.isSignedIn) {
            this.authService.rememberPage(this.globalService.pages.flights);
            this.router.navigateByUrl(this.globalService.pages.signIn);

            return;
        }

        this.createReservation(card);
    }


    private setFlights(source: KzFlight[]): void {
        this.flights = [...source].sort((first, second) => second.departureTime.localeCompare(first.departureTime));
        this.cards = this.buildCards(this.flights);
    }


    private buildCards(source: readonly KzFlight[]): KzItemCardData[] {
        return source.map((flight) => {
            const pastStart = hasStartDatePassed(flight.departureTime);

            return {
                id: flight.id,
                type: KzItemType.FLIGHT,
                title: `${flight.departureCity} - ${flight.arrivalCity}`,
                subtitle: `${flight.airline} ${flight.flightNumber}`,
                icon: KzIconName.PLANE,
                imageUrl: flight.imageUrl,
                price: flight.price,
                unitLabel: this.PRICE_UNIT,
                badge: flight.active ? this.SEATS_LABEL : this.INACTIVE_LABEL,
                badgeTone: flight.active ? KzTone.NEUTRAL : KzTone.DANGER,
                meta: [
                    { label: this.DEPART_LABEL, value: this.datePipe.transform(flight.departureTime, true) },
                    { label: this.ARRIVAL_TIME_LABEL, value: this.datePipe.transform(flight.arrivalTime, true) },
                    { label: this.COMPANY_LABEL, value: flight.airline },
                    { label: this.NUMBER_LABEL, value: flight.flightNumber },
                    { label: this.SEATS_LABEL, value: String(flight.availableSeats) },
                ],
                actionLabel: this.RESERVE_LABEL,
                disabled: !flight.active || flight.availableSeats < this.requestedQuantity || pastStart,
                disabledLabel: pastStart
                    ? this.EXPIRED_LABEL
                    : flight.availableSeats === 0 ? this.SOLD_OUT_LABEL : this.INACTIVE_LABEL,
            };
        });
    }


    private get requestedQuantity(): number {
        const quantity = Number(this.filter.quantity);

        return quantity > 0 ? quantity : DEFAULT_KZ_FLIGHT_QUANTITY;
    }


    private async createReservation(card: KzItemCardData): Promise<void> {
        if (this.isReserving) {
            return;
        }

        this.isReserving = true;
        this.reservingId = card.id;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.reservations, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify({
                    typeItem: KzItemType.FLIGHT,
                    itemId: card.id,
                    quantity: this.requestedQuantity,
                }),
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzReservation>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null || parsed.data === null) {
                this.errorMessage = parsed.error?.message ?? KZ_LABELS.unexpectedError;

                return;
            }

            this.authService.savePendingReservation(parsed.data);
            this.filtersTouched = false;
            this.router.navigateByUrl(this.globalService.pages.payment);
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isReserving = false;
            this.reservingId = 0;
        }
    }
}
