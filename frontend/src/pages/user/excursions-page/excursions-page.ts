import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzExcursion } from '../../../models/kz_excursion.interface';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
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
    DEFAULT_KZ_EXCURSION_FILTER,
    DEFAULT_KZ_EXCURSION_QUANTITY,
    KzExcursionFilter,
} from './models/kz_excursion_filter.interface';


@Component({
    selector: 'kz-excursions-page',
    standalone: true,
    imports: [KzCard, KzFilterBar, KzLoading],
    templateUrl: './excursions-page.html',
    styleUrl: './excursions-page.css',
})
export class ExcursionsPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Excursions';
    readonly PAGE_SUBTITLE = 'Discover the destination with a local guide.';
    readonly LOCATION_LABEL = 'Location';
    readonly DATE_LABEL = 'Date';
    readonly MAX_PRICE_LABEL = 'Max price';
    readonly QUANTITY_LABEL = 'Guests';
    readonly LOCATION_PLACEHOLDER = 'Marrakech';
    readonly RESERVE_LABEL = 'Book';
    readonly SOLD_OUT_LABEL = 'Booked';
    readonly PRICE_UNIT = 'per person';
    readonly DURATION_LABEL = 'Duration';
    readonly GUIDE_LABEL = 'Guide';
    readonly SEATS_LABEL = 'Seats';
    readonly MINUTES_IN_HOUR = 60;
    readonly EMPTY_LABEL = KZ_LABELS.noResult;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly datePipe = inject(KzDatePipe);
    private readonly router = inject(Router);

    excursions: KzExcursion[] = [];
    cards: KzItemCardData[] = [];
    filter: KzExcursionFilter = { ...DEFAULT_KZ_EXCURSION_FILTER };
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
                name: 'location',
                label: this.LOCATION_LABEL,
                type: KzFieldType.TEXT,
                value: this.filter.location,
                placeholder: this.LOCATION_PLACEHOLDER,
                options: [],
            },
            {
                name: 'date',
                label: this.DATE_LABEL,
                type: KzFieldType.DATE,
                value: this.filter.date,
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
        this.loadExcursions();
    }


    hasUnsavedChanges(): boolean {
        return this.filtersTouched;
    }


    onFiltersChanged(values: Record<string, string>): void {
        this.filtersTouched = true;
        this.applyFilters(values);
    }


    onFiltersReset(): void {
        this.filter = { ...DEFAULT_KZ_EXCURSION_FILTER };
        this.applyFilters({});
    }


    async loadExcursions(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.excursions, {
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

            this.excursions = parseList<KzExcursion>(parsed.data);
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
            location: values['location'] ?? this.filter.location,
            date: values['date'] ?? this.filter.date,
            maxPrice: values['maxPrice'] ?? this.filter.maxPrice,
            quantity: values['quantity'] ?? this.filter.quantity,
        };

        this.cards = this.buildCards(this.filterExcursions(this.excursions));
    }


    onOpen(card: KzItemCardData): void {
        this.router.navigateByUrl(this.globalService.pages.excursionDetail(card.id));
    }


    onReserve(card: KzItemCardData): void {
        if (!this.authService.isSignedIn) {
            this.authService.rememberPage(this.globalService.pages.excursions);
            this.router.navigateByUrl(this.globalService.pages.signIn);

            return;
        }

        this.createReservation(card);
    }


    private filterExcursions(source: readonly KzExcursion[]): KzExcursion[] {
        const location = this.filter.location.trim().toLowerCase();
        const date = this.filter.date;
        const maxPrice = Number(this.filter.maxPrice);

        return source.filter((item) => {
            const matchesLocation = location.length === 0
                || item.location.toLowerCase().includes(location);
            const matchesDate = date.length === 0 || item.date.startsWith(date);
            const matchesPrice = this.filter.maxPrice.length === 0 || item.price <= maxPrice;

            return matchesLocation && matchesDate && matchesPrice;
        });
    }


    private buildCards(source: readonly KzExcursion[]): KzItemCardData[] {
        return source.map((item) => ({
            id: item.id,
            type: KzItemType.EXCURSION,
            title: item.title,
            subtitle: item.location,
            icon: KzIconName.COMPASS,
            imageUrl: item.imageUrl,
            price: item.price,
            unitLabel: this.PRICE_UNIT,
            badge: '',
            badgeTone: KzTone.NEUTRAL,
            meta: [
                { label: this.LOCATION_LABEL, value: item.location },
                {
                    label: this.DATE_LABEL,
                    value: `${this.datePipe.transform(item.date)} ${this.datePipe.transform(item.startTime, true).slice(-5)}`,
                },
                { label: this.DURATION_LABEL, value: this.formatDuration(item.dureeMinutes) },
                { label: this.GUIDE_LABEL, value: item.guide },
                { label: this.SEATS_LABEL, value: String(item.availableSeats) },
            ],
            actionLabel: this.RESERVE_LABEL,
            disabled: !item.available,
            disabledLabel: this.SOLD_OUT_LABEL,
        }));
    }


    private formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / this.MINUTES_IN_HOUR);
        const rest = minutes % this.MINUTES_IN_HOUR;

        return `${hours}h${rest > 0 ? ` ${rest}min` : ''}`;
    }


    private get requestedQuantity(): number {
        const quantity = Number(this.filter.quantity);

        return quantity > 0 ? quantity : DEFAULT_KZ_EXCURSION_QUANTITY;
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
                    typeItem: KzItemType.EXCURSION,
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
