import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { KzExcursion } from '../../../models/kz_excursion.interface';
import { KzBreadcrumbItem } from '../../../models/kz_breadcrumb_item.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzItemDetailData, KzItemDetailRow } from '../../../models/kz_item_detail_data.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { KzLabels } from '../../../models/kz_labels.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
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


@Component({
    selector: 'kz-excursion-detail-page',
    standalone: true,
    imports: [KzBreadcrumb, KzErrorPopup, KzItemDetail, KzLoading],
    templateUrl: './excursion-detail-page.html',
    styleUrl: './excursion-detail-page.css',
})
export class ExcursionDetailPage implements OnInit {
    readonly HOME_LABEL = 'Home';
    readonly SECTION_LABEL = 'Excursions';
    readonly RESERVE_LABEL = 'Book';
    readonly SOLD_OUT_LABEL = 'Booked';
    readonly EXPIRED_LABEL = 'Expired';
    readonly QUANTITY_LABEL = 'Guests';
    readonly PRICE_UNIT = 'per person';
    readonly LOCATION_LABEL = 'Location';
    readonly DATE_LABEL = 'Date';
    readonly DURATION_LABEL = 'Duration';
    readonly GUIDE_LABEL = 'Guide';
    readonly CAPACITY_LABEL = 'Capacity';
    readonly AVAILABLE_SEATS_LABEL = 'Available seats';
    readonly EMPTY_LABEL = KZ_LABELS.noResult;
    readonly MINUTES_IN_HOUR = 60;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly datePipe = inject(KzDatePipe);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly detailService = inject(ItemDetailService);

    detail: KzItemDetailData | null = null;
    item: KzExcursion | null = null;
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
            { label: this.SECTION_LABEL, path: this.globalService.pages.excursions },
        ];

        if (this.item !== null) {
            trail.push({ label: this.item.title, path: '' });
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
                KzItemType.EXCURSION,
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
        const result = await this.detailService.load<KzExcursion>(this.globalService.routes.excursion(id));

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


    private buildDetail(item: KzExcursion): KzItemDetailData {
        const pastStart = hasStartDatePassed(item.date);

        return {
            id: item.id,
            type: KzItemType.EXCURSION,
            title: item.title,
            subtitle: item.location,
            icon: KzIconName.COMPASS,
            imageUrl: item.imageUrl,
            description: item.description,
            price: item.price,
            unitLabel: this.PRICE_UNIT,
            badge: '',
            badgeTone: KzTone.NEUTRAL,
            rows: this.buildRows(item),
            sections: [],
            actionLabel: this.RESERVE_LABEL,
            disabled: !item.available || pastStart,
            disabledLabel: pastStart ? this.EXPIRED_LABEL : this.SOLD_OUT_LABEL,
            maxQuantity: Math.max(1, item.availableSeats),
        };
    }


    private buildRows(item: KzExcursion): KzItemDetailRow[] {
        return [
            { label: this.LOCATION_LABEL, value: item.location },
            { label: this.DATE_LABEL, value: this.datePipe.transform(`${item.date.slice(0, 10)}T${item.startTime}`, true) },
            { label: this.DURATION_LABEL, value: this.formatDuration(item.dureeMinutes) },
            { label: this.GUIDE_LABEL, value: item.guide },
            { label: this.CAPACITY_LABEL, value: String(item.capacity) },
            { label: this.AVAILABLE_SEATS_LABEL, value: String(item.availableSeats) },
        ];
    }


    private formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / this.MINUTES_IN_HOUR);
        const rest = minutes % this.MINUTES_IN_HOUR;

        return `${hours}h${rest > 0 ? ` ${rest}min` : ''}`;
    }
}