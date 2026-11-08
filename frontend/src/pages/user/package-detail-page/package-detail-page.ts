import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { KzExcursion } from '../../../models/kz_excursion.interface';
import { KzFlight } from '../../../models/kz_flight.interface';
import { KzBreadcrumbItem } from '../../../models/kz_breadcrumb_item.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzItemDetailData, KzItemDetailRow, KzItemDetailSection } from '../../../models/kz_item_detail_data.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { KzLabels } from '../../../models/kz_labels.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzPackage } from '../../../models/kz_package.interface';
import { hasStartDatePassed } from '../../../models/kz_reservation_policy';
import { KzTone } from '../../../models/kz_tone.enum';
import { KzDatePipe } from '../../../pipes/kz-date.pipe';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { ItemDetailService } from '../../../services/item-detail.service';
import { KzBreadcrumb } from '../../../components/kz-breadcrumb/kz-breadcrumb';
import { KzErrorPopup } from '../../../components/kz-error-popup/kz-error-popup';
import { KzItemDetail } from '../../../components/kz-item-detail/kz-item-detail';
import { KzLoading } from '../../../components/kz-loading/kz-loading';


const MS_PER_DAY = 86400000;


@Component({
    selector: 'kz-package-detail-page',
    standalone: true,
    imports: [KzBreadcrumb, KzErrorPopup, KzItemDetail, KzLoading],
    templateUrl: './package-detail-page.html',
    styleUrl: './package-detail-page.css',
})
export class PackageDetailPage implements OnInit {
    readonly HOME_LABEL = 'Home';
    readonly SECTION_LABEL = 'Packages';
    readonly RESERVE_LABEL = 'Book';
    readonly SOLD_OUT_LABEL = 'Booked';
    readonly EXPIRED_LABEL = 'Expired';
    readonly QUANTITY_LABEL = 'Guests';
    readonly PRICE_UNIT = 'per person';
    readonly DESTINATION_LABEL = 'Destination';
    readonly DATES_LABEL = 'Dates';
    readonly NIGHTS_LABEL = 'Nights';
    readonly DISCOUNT_LABEL = 'Discount';
    readonly OLD_PRICE_LABEL = 'Regular price';
    readonly FLIGHTS_TITLE = 'Flights included';
    readonly EXCURSIONS_TITLE = 'Included excursions';
    readonly EMPTY_LABEL = KZ_LABELS.noResult;
    readonly PACKAGE_CAPACITY = 10;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly datePipe = inject(KzDatePipe);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly detailService = inject(ItemDetailService);

    detail: KzItemDetailData | null = null;
    item: KzPackage | null = null;
    quantity = 1;
    isLoading = true;
    isReserving = false;
    errorMessage = '';


    get labels(): KzLabels {
        return KZ_LABELS;
    }


    get breadcrumb(): KzBreadcrumbItem[] {
        const trail: KzBreadcrumbItem[] = [
            { label: this.HOME_LABEL, path: this.globalService.pages.home },
            { label: this.SECTION_LABEL, path: this.globalService.pages.packages },
        ];

        if (this.item !== null) {
            trail.push({ label: this.item.name, path: '' });
        }

        return trail;
    }


    ngOnInit(): void {
        this.load();
    }


    onQuantityChanged(quantity: number): void {
        this.quantity = quantity;
    }


    async onReserve(): Promise<void> {
        if (this.item === null || this.isReserving || this.detail?.disabled === true) {
            return;
        }

        this.isReserving = true;
        this.errorMessage = '';

        try {
            this.authService.rememberPage(this.router.url);
            const result = await this.detailService.reserve(
                KzItemType.PACKAGE,
                this.item.id,
                this.quantity,
            );

            if (result.signedOut) {
                this.router.navigateByUrl(this.globalService.pages.signIn);

                return;
            }

            if (result.error.length > 0) {
                this.errorMessage = result.error;

                return;
            }

            this.router.navigateByUrl(result.path);
        }
        finally {
            this.isReserving = false;
        }
    }


    private async load(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        const id = Number(this.route.snapshot.paramMap.get('id') ?? '0');
        const result = await this.detailService.load<KzPackage>(this.globalService.routes.package(id));

        if (result.signedOut) {
            this.router.navigateByUrl(this.globalService.pages.signIn);

            return;
        }

        if (result.item === null) {
            this.errorMessage = result.error.length > 0 ? result.error : KZ_LABELS.noResult;
            this.isLoading = false;

            return;
        }

        this.item = result.item;
        this.detail = this.buildDetail(result.item);
        this.isLoading = false;
    }


    private buildDetail(item: KzPackage): KzItemDetailData {
        const pastStart = hasStartDatePassed(item.startDate);

        return {
            id: item.id,
            type: KzItemType.PACKAGE,
            title: item.name,
            subtitle: item.destination,
            icon: KzIconName.SUITCASE,
            imageUrl: item.imageUrl,
            description: item.description,
            price: item.promoPrice > 0 ? item.promoPrice : item.price,
            unitLabel: this.PRICE_UNIT,
            badge: item.discountPercentage > 0 ? `-${item.discountPercentage}%` : '',
            badgeTone: KzTone.SUCCESS,
            rows: this.buildRows(item),
            sections: [
                this.buildFlightsSection(item.composition.flights),
                this.buildExcursionsSection(item.composition.excursions),
            ],
            actionLabel: this.RESERVE_LABEL,
            disabled: !item.available || pastStart,
            disabledLabel: pastStart ? this.EXPIRED_LABEL : this.SOLD_OUT_LABEL,
            maxQuantity: this.PACKAGE_CAPACITY,
        };
    }


    private buildRows(item: KzPackage): KzItemDetailRow[] {
        const rows: KzItemDetailRow[] = [
            { label: this.DESTINATION_LABEL, value: item.destination },
            {
                label: this.DATES_LABEL,
                value: `${this.datePipe.transform(item.startDate)} - ${this.datePipe.transform(item.endDate)}`,
            },
            { label: this.NIGHTS_LABEL, value: String(this.calculateNights(item)) },
            { label: this.DISCOUNT_LABEL, value: `${item.discountPercentage}%` },
        ];

        if (item.promoPrice > 0) {
            rows.push({ label: this.OLD_PRICE_LABEL, value: String(item.price) });
        }

        return rows;
    }


    private calculateNights(item: KzPackage): number {
        const start = Date.parse(`${item.startDate.slice(0, 10)}T00:00:00Z`);
        const end = Date.parse(`${item.endDate.slice(0, 10)}T00:00:00Z`);

        if (Number.isNaN(start) || Number.isNaN(end)) {
            return item.durationNights;
        }

        return Math.max(0, Math.round((end - start) / MS_PER_DAY));
    }


    private buildFlightsSection(flights: readonly KzFlight[]): KzItemDetailSection {
        return {
            id: 'flights',
            title: this.FLIGHTS_TITLE,
            rows: flights.map((flight) => ({
                label: `${flight.airline} ${flight.flightNumber}`,
                value: `${flight.departureCity} - ${flight.arrivalCity} ${this.datePipe.transform(flight.departureTime, true)}`,
            })),
        };
    }


    private buildExcursionsSection(excursions: readonly KzExcursion[]): KzItemDetailSection {
        return {
            id: 'excursions',
            title: this.EXCURSIONS_TITLE,
            rows: excursions.map((excursion) => ({
                label: excursion.title,
                value: `${excursion.date} ${excursion.startTime} - ${excursion.location}`,
            })),
        };
    }
}