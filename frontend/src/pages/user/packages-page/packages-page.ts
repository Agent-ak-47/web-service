import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzItemCardData } from '../../../models/kz_item_card_data.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { KzLabels } from '../../../models/kz_labels.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzPackage } from '../../../models/kz_package.interface';
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
    DEFAULT_KZ_PACKAGE_FILTER,
    DEFAULT_KZ_PACKAGE_QUANTITY,
    KzPackageFilter,
} from './models/kz_package_filter.interface';


@Component({
    selector: 'kz-packages-page',
    standalone: true,
    imports: [KzCard, KzFilterBar, KzLoading],
    templateUrl: './packages-page.html',
    styleUrl: './packages-page.css',
})
export class PackagesPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Packages';
    readonly PAGE_SUBTITLE = 'Full stays with flights and excursions included.';
    readonly DESTINATION_LABEL = 'Destination';
    readonly DATE_LABEL = 'Departure date';
    readonly MAX_PRICE_LABEL = 'Max price';
    readonly QUANTITY_LABEL = 'Guests';
    readonly DESTINATION_PLACEHOLDER = 'Marrakech';
    readonly RESERVE_LABEL = 'Book';
    readonly SOLD_OUT_LABEL = 'Booked';
    readonly PRICE_UNIT = 'per person';
    readonly DATES_LABEL = 'Dates';
    readonly NIGHTS_LABEL = 'Nights';
    readonly DISCOUNT_LABEL = 'Discount';
    readonly NO_DISCOUNT_LABEL = '-';
    readonly EMPTY_LABEL = KZ_LABELS.noResult;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly datePipe = inject(KzDatePipe);
    private readonly router = inject(Router);

    packages: KzPackage[] = [];
    cards: KzItemCardData[] = [];
    filter: KzPackageFilter = { ...DEFAULT_KZ_PACKAGE_FILTER };
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
                name: 'destination',
                label: this.DESTINATION_LABEL,
                type: KzFieldType.TEXT,
                value: this.filter.destination,
                placeholder: this.DESTINATION_PLACEHOLDER,
                options: [],
            },
            {
                name: 'startDate',
                label: this.DATE_LABEL,
                type: KzFieldType.DATE,
                value: this.filter.startDate,
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
        this.loadPackages();
    }


    hasUnsavedChanges(): boolean {
        return this.filtersTouched;
    }


    onFiltersChanged(values: Record<string, string>): void {
        this.filtersTouched = true;
        this.applyFilters(values);
    }


    onFiltersReset(): void {
        this.filter = { ...DEFAULT_KZ_PACKAGE_FILTER };
        this.applyFilters({});
    }


    async loadPackages(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.packages, {
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

            this.packages = parseList<KzPackage>(parsed.data);
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
            destination: values['destination'] ?? this.filter.destination,
            startDate: values['startDate'] ?? this.filter.startDate,
            maxPrice: values['maxPrice'] ?? this.filter.maxPrice,
            quantity: values['quantity'] ?? this.filter.quantity,
        };

        this.cards = this.buildCards(this.filterPackages(this.packages));
    }


    onOpen(card: KzItemCardData): void {
        this.router.navigateByUrl(this.globalService.pages.packageDetail(card.id));
    }


    onReserve(card: KzItemCardData): void {
        if (!this.authService.isSignedIn) {
            this.authService.rememberPage(this.globalService.pages.packages);
            this.router.navigateByUrl(this.globalService.pages.signIn);

            return;
        }

        this.createReservation(card);
    }


    private filterPackages(source: readonly KzPackage[]): KzPackage[] {
        const destination = this.filter.destination.trim().toLowerCase();
        const date = this.filter.startDate;
        const maxPrice = Number(this.filter.maxPrice);

        return source.filter((item) => {
            const matchesDestination = destination.length === 0
                || item.destination.toLowerCase().includes(destination);
            const matchesDate = date.length === 0 || item.startDate.startsWith(date);
            const price = item.promoPrice > 0 ? item.promoPrice : item.price;
            const matchesPrice = this.filter.maxPrice.length === 0 || price <= maxPrice;

            return matchesDestination && matchesDate && matchesPrice;
        });
    }


    private buildCards(source: readonly KzPackage[]): KzItemCardData[] {
        return source.map((item) => ({
            id: item.id,
            type: KzItemType.PACKAGE,
            title: item.name,
            subtitle: item.destination,
            icon: KzIconName.SUITCASE,
            imageUrl: item.imageUrl,
            price: item.promoPrice > 0 ? item.promoPrice : item.price,
            unitLabel: this.PRICE_UNIT,
            badge: item.discountPercentage > 0 ? `-${item.discountPercentage}%` : '',
            badgeTone: KzTone.SUCCESS,
            meta: [
                { label: this.DESTINATION_LABEL, value: item.destination },
                {
                    label: this.DATES_LABEL,
                    value: `${this.datePipe.transform(item.startDate)} - ${this.datePipe.transform(item.endDate)}`,
                },
                { label: this.NIGHTS_LABEL, value: String(item.durationNights) },
                {
                    label: this.DISCOUNT_LABEL,
                    value: item.discountPercentage > 0
                        ? `-${item.discountPercentage}%`
                        : this.NO_DISCOUNT_LABEL,
                },
            ],
            actionLabel: this.RESERVE_LABEL,
            disabled: !item.available,
            disabledLabel: this.SOLD_OUT_LABEL,
        }));
    }


    private get requestedQuantity(): number {
        const quantity = Number(this.filter.quantity);

        return quantity > 0 ? quantity : DEFAULT_KZ_PACKAGE_QUANTITY;
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
                    typeItem: KzItemType.PACKAGE,
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
