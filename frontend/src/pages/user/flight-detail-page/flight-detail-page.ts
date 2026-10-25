import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { KzFlight } from '../../../models/kz_flight.interface';
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
import { KzItemDetail } from '../../../components/kz-item-detail/kz-item-detail';
import { KzLoading } from '../../../components/kz-loading/kz-loading';


@Component({
    selector: 'kz-flight-detail-page',
    standalone: true,
    imports: [KzBreadcrumb, KzItemDetail, KzLoading],
    templateUrl: './flight-detail-page.html',
    styleUrl: './flight-detail-page.css',
})
export class FlightDetailPage implements OnInit {
    readonly HOME_LABEL = 'Home';
    readonly SECTION_LABEL = 'Flights';
    readonly RESERVE_LABEL = 'Book';
    readonly SOLD_OUT_LABEL = 'Booked';
    readonly INACTIVE_LABEL = 'Unavailable';
    readonly EXPIRED_LABEL = 'Expired';
    readonly ACTIVE_LABEL = 'Available';
    readonly QUANTITY_LABEL = 'Seats';
    readonly PRICE_UNIT = 'per passenger';
    readonly COMPANY_LABEL = 'Airline';
    readonly NUMBER_LABEL = 'Number';
    readonly DEPART_LABEL = 'Departure';
    readonly ARRIVAL_LABEL = 'Arrival';
    readonly DURATION_LABEL = 'Duration';
    readonly TOTAL_SEATS_LABEL = 'Total seats';
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
    item: KzFlight | null = null;
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
            { label: this.SECTION_LABEL, path: this.globalService.pages.flights },
        ];

        if (this.item !== null) {
            trail.push({ label: `${this.item.departureCity} - ${this.item.arrivalCity}`, path: '' });
        }

        return trail;
    }


    ngOnInit(): void {
        this.load();
    }


    onQuantityChanged(quantity: number): void {
        this.quantity = Math.min(quantity, this.maxQuantity);
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
                KzItemType.FLIGHT,
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


    private get maxQuantity(): number {
        return this.item === null ? 1 : Math.max(1, this.item.availableSeats);
    }


    private async load(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        const id = Number(this.route.snapshot.paramMap.get('id') ?? '0');
        const result = await this.detailService.load<KzFlight>(this.globalService.routes.flight(id));

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


    private buildDetail(item: KzFlight): KzItemDetailData {
        const pastStart = hasStartDatePassed(item.departureTime);

        return {
            id: item.id,
            type: KzItemType.FLIGHT,
            title: `${item.departureCity} - ${item.arrivalCity}`,
            subtitle: `${item.airline} ${item.flightNumber}`,
            icon: KzIconName.PLANE,
            imageUrl: item.imageUrl,
            description: this.buildDescription(item),
            price: item.price,
            unitLabel: this.PRICE_UNIT,
            badge: item.active ? this.ACTIVE_LABEL : this.INACTIVE_LABEL,
            badgeTone: item.active ? KzTone.SUCCESS : KzTone.DANGER,
            rows: this.buildRows(item),
            sections: [],
            actionLabel: this.RESERVE_LABEL,
            disabled: !item.active || item.availableSeats === 0 || pastStart,
            disabledLabel: pastStart
                ? this.EXPIRED_LABEL
                : item.availableSeats === 0 ? this.SOLD_OUT_LABEL : this.INACTIVE_LABEL,
            maxQuantity: Math.max(1, item.availableSeats),
        };
    }


    private buildDescription(item: KzFlight): string {
        return `Flight ${item.flightNumber} of ${item.airline} from ${item.departureCity} to ${item.arrivalCity}. Estimated duration ${this.formatDuration(item)}. Cabin bag included, extra seats on request.`;
    }


    private buildRows(item: KzFlight): KzItemDetailRow[] {
        return [
            { label: this.COMPANY_LABEL, value: item.airline },
            { label: this.NUMBER_LABEL, value: item.flightNumber },
            { label: this.DEPART_LABEL, value: this.datePipe.transform(item.departureTime, true) },
            { label: this.ARRIVAL_LABEL, value: this.datePipe.transform(item.arrivalTime, true) },
            { label: this.DURATION_LABEL, value: this.formatDuration(item) },
            { label: this.TOTAL_SEATS_LABEL, value: String(item.totalSeats) },
            { label: this.AVAILABLE_SEATS_LABEL, value: String(item.availableSeats) },
        ];
    }


    private formatDuration(item: KzFlight): string {
        const departure = new Date(item.departureTime).getTime();
        const arrival = new Date(item.arrivalTime).getTime();

        if (Number.isNaN(departure) || Number.isNaN(arrival) || arrival <= departure) {
            return '-';
        }

        const minutes = Math.round((arrival - departure) / 60000);
        const hours = Math.floor(minutes / this.MINUTES_IN_HOUR);
        const rest = minutes % this.MINUTES_IN_HOUR;

        return `${hours}h${rest > 0 ? ` ${rest}min` : ''}`;
    }
}