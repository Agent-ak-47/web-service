import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KzFlight } from '../../../models/kz_flight.interface';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzItemCardData } from '../../../models/kz_item_card_data.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { KzLabels } from '../../../models/kz_labels.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzReservation } from '../../../models/kz_reservation.interface';
import { parseList, parseResponse } from '../../../models/kz_response';
import { KzTone } from '../../../models/kz_tone.enum';
import { KzDatePipe } from '../../../pipes/kz-date.pipe';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzCard } from '../../../components/kz-card/kz-card';
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
    imports: [KzCard, KzFilterBar, KzLoading],
    templateUrl: './flights-page.html',
    styleUrl: './flights-page.css',
})
export class FlightsPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Vols';
    readonly PAGE_SUBTITLE = 'Choisissez votre vol et reservez votre place en quelques clics.';
    readonly DEPARTURE_LABEL = 'Ville de depart';
    readonly ARRIVAL_LABEL = 'Ville d arrivee';
    readonly DATE_LABEL = 'Date de depart';
    readonly MAX_PRICE_LABEL = 'Prix maximum';
    readonly QUANTITY_LABEL = 'Places';
    readonly DEPARTURE_PLACEHOLDER = 'Casablanca';
    readonly ARRIVAL_PLACEHOLDER = 'Paris';
    readonly RESERVE_LABEL = 'Reserver';
    readonly SOLD_OUT_LABEL = 'Complet';
    readonly INACTIVE_LABEL = 'Indisponible';
    readonly PRICE_UNIT = 'par passager';
    readonly DEPART_LABEL = 'Depart';
    readonly ARRIVAL_TIME_LABEL = 'Arrivee';
    readonly COMPANY_LABEL = 'Compagnie';
    readonly NUMBER_LABEL = 'Numero';
    readonly SEATS_LABEL = 'Sieges';
    readonly EMPTY_LABEL = KZ_LABELS.noResult;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly datePipe = inject(KzDatePipe);
    private readonly router = inject(Router);

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
        this.loadFlights();
    }


    hasUnsavedChanges(): boolean {
        return this.filtersTouched;
    }


    onFiltersChanged(values: Record<string, string>): void {
        this.filtersTouched = true;
        this.applyFilters(values);
    }


    onFiltersReset(): void {
        this.filter = { ...DEFAULT_KZ_FLIGHT_FILTER };
        this.applyFilters({});
    }


    async loadFlights(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.flights, {
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

            this.flights = parseList<KzFlight>(parsed.data);
            this.applyFilters({});
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isLoading = false;
        }
    }


    applyFilters(values: Record<string, string>): void {
        this.filter = {
            departureCity: values['departureCity'] ?? this.filter.departureCity,
            arrivalCity: values['arrivalCity'] ?? this.filter.arrivalCity,
            departureDate: values['departureDate'] ?? this.filter.departureDate,
            maxPrice: values['maxPrice'] ?? this.filter.maxPrice,
            quantity: values['quantity'] ?? this.filter.quantity,
        };

        this.cards = this.buildCards(this.filterFlights(this.flights));
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


    private filterFlights(source: readonly KzFlight[]): KzFlight[] {
        const departure = this.filter.departureCity.trim().toLowerCase();
        const arrival = this.filter.arrivalCity.trim().toLowerCase();
        const date = this.filter.departureDate;
        const maxPrice = Number(this.filter.maxPrice);

        return source.filter((flight) => {
            const matchesDeparture = departure.length === 0
                || flight.departureCity.toLowerCase().includes(departure);
            const matchesArrival = arrival.length === 0
                || flight.arrivalCity.toLowerCase().includes(arrival);
            const matchesDate = date.length === 0 || flight.departureTime.startsWith(date);
            const matchesPrice = this.filter.maxPrice.length === 0 || flight.price <= maxPrice;

            return matchesDeparture && matchesArrival && matchesDate && matchesPrice;
        });
    }


    private buildCards(source: readonly KzFlight[]): KzItemCardData[] {
        return source.map((flight) => ({
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
            disabled: !flight.active || flight.availableSeats < this.requestedQuantity,
            disabledLabel: flight.availableSeats === 0 ? this.SOLD_OUT_LABEL : this.INACTIVE_LABEL,
        }));
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
