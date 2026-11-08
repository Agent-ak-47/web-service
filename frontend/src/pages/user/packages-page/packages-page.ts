import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzItemCardData } from '../../../models/kz_item_card_data.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { KzLabels } from '../../../models/kz_labels.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzPackage } from '../../../models/kz_package.interface';
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
    DEFAULT_KZ_PACKAGE_FILTER,
    DEFAULT_KZ_PACKAGE_QUANTITY,
    KzPackageFilter,
} from './models/kz_package_filter.interface';


const MS_PER_DAY = 86400000;


@Component({
    selector: 'kz-packages-page',
    standalone: true,
    imports: [KzCard, KzErrorPopup, KzFilterBar, KzLoading],
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
    readonly EXPIRED_LABEL = 'Expired';
    readonly PRICE_UNIT = 'per person';
    readonly START_DATE_LABEL = 'Start date';
    readonly END_DATE_LABEL = 'End date';
    readonly NIGHTS_LABEL = 'Nights';
    readonly DISCOUNT_LABEL = 'Discount';
    readonly NO_DISCOUNT_LABEL = '-';
    readonly EMPTY_LABEL = KZ_LABELS.noResult;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly datePipe = inject(KzDatePipe);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

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
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.applyQueryParams(params);
                void this.loadPackages();
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
        this.filter = { ...DEFAULT_KZ_PACKAGE_FILTER };
        await this.onFiltersSubmitted();
    }


    async loadPackages(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(addQuery(this.globalService.routes.packages, this.apiParams()), {
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

            this.setPackages(parseList<KzPackage>(parsed.data));
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
            destination: values['destination'] ?? this.filter.destination,
            startDate: values['startDate'] ?? this.filter.startDate,
            maxPrice: values['maxPrice'] ?? this.filter.maxPrice,
            quantity: values['quantity'] ?? this.filter.quantity,
        };
    }


    private applyQueryParams(params: ParamMap): void {
        this.filter = {
            destination: params.get('destination') ?? '',
            startDate: params.get('startDate') ?? '',
            maxPrice: params.get('maxPrice') ?? '',
            quantity: params.get('quantity') ?? String(DEFAULT_KZ_PACKAGE_QUANTITY),
        };
    }


    private queryParams(): KzQueryParams {
        const params = cleanQueryParams({
            destination: this.filter.destination,
            startDate: this.filter.startDate,
            maxPrice: this.filter.maxPrice,
            quantity: this.filter.quantity,
        });

        if (params['quantity'] === String(DEFAULT_KZ_PACKAGE_QUANTITY)) {
            delete params['quantity'];
        }

        return params;
    }


    private apiParams(): KzQueryParams {
        return cleanQueryParams({
            destination: this.filter.destination,
            startDate: this.filter.startDate,
            maxPrice: this.filter.maxPrice,
        });
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


    private setPackages(source: KzPackage[]): void {
        this.packages = [...source].sort((first, second) => second.startDate.localeCompare(first.startDate));
        this.cards = this.buildCards(this.packages);
    }


    private buildCards(source: readonly KzPackage[]): KzItemCardData[] {
        return source.map((item) => {
            const pastStart = hasStartDatePassed(item.startDate);

            return {
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
                    { label: this.START_DATE_LABEL, value: this.datePipe.transformDateTime(item.startDate) },
                    { label: this.END_DATE_LABEL, value: this.datePipe.transformDateTime(item.endDate) },
                    { label: this.NIGHTS_LABEL, value: String(this.calculateNights(item)) },
                    {
                        label: this.DISCOUNT_LABEL,
                        value: item.discountPercentage > 0
                            ? `-${item.discountPercentage}%`
                            : this.NO_DISCOUNT_LABEL,
                    },
                ],
                actionLabel: this.RESERVE_LABEL,
                disabled: !item.available || pastStart,
                disabledLabel: pastStart ? this.EXPIRED_LABEL : this.SOLD_OUT_LABEL,
            };
        });
    }


    private calculateNights(item: KzPackage): number {
        const start = Date.parse(`${item.startDate.slice(0, 10)}T00:00:00Z`);
        const end = Date.parse(`${item.endDate.slice(0, 10)}T00:00:00Z`);

        if (Number.isNaN(start) || Number.isNaN(end)) {
            return item.durationNights;
        }

        return Math.max(0, Math.round((end - start) / MS_PER_DAY));
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
