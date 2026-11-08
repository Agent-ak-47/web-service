import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { KzExcursion } from '../../../models/kz_excursion.interface';
import { KzFlight } from '../../../models/kz_flight.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzItemCardData } from '../../../models/kz_item_card_data.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzPackage } from '../../../models/kz_package.interface';
import { KzTone } from '../../../models/kz_tone.enum';
import { parseList, parseResponse } from '../../../models/kz_response';
import { KzDatePipe } from '../../../pipes/kz-date.pipe';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzCard } from '../../../components/kz-card/kz-card';
import { KzErrorPopup } from '../../../components/kz-error-popup/kz-error-popup';
import { KzLoading } from '../../../components/kz-loading/kz-loading';
import { KzHeroAction } from './components/hero/hero_action.interface';
import { Hero } from './components/hero/hero';
import { KzHomeSection } from './models/kz_home_section.interface';


const MS_PER_DAY = 86400000;


@Component({
    selector: 'kz-home-page',
    standalone: true,
    imports: [Hero, KzCard, KzErrorPopup, KzLoading, RouterLink],
    templateUrl: './home-page.html',
    styleUrl: './home-page.css',
})
export class HomePage implements OnInit {
    readonly HIGHLIGHT_LIMIT = 3;
    readonly SEE_ALL_LABEL = 'See all';
    readonly PACKAGES_TITLE = 'Packages';
    readonly PACKAGES_SUBTITLE = 'Full stays with flights and excursions included.';
    readonly FLIGHTS_TITLE = 'Flights';
    readonly FLIGHTS_SUBTITLE = 'The next departures at the best price.';
    readonly EXCURSIONS_TITLE = 'Excursions';
    readonly EXCURSIONS_SUBTITLE = 'Discover the destination with a local guide.';
    readonly NIGHTS_LABEL = 'Nights';
    readonly DESTINATION_LABEL = 'Destination';
    readonly START_DATE_LABEL = 'Start date';
    readonly END_DATE_LABEL = 'End date';
    readonly GUIDE_LABEL = 'Guide';
    readonly LOCATION_LABEL = 'Location';
    readonly DATE_LABEL = 'Date';
    readonly DURATION_LABEL = 'Duration';
    readonly PACKAGE_UNIT = 'per person';
    readonly EXCURSION_UNIT = 'per person';
    readonly FLIGHT_UNIT = 'per passenger';
    readonly DEPARTURE_META = 'Departure';
    readonly ARRIVAL_META = 'Arrival';
    readonly DISCOVER_LABEL = 'Discover';
    readonly SOLD_OUT_LABEL = 'Booked';
    readonly MINUTES_IN_HOUR = 60;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly datePipe = inject(KzDatePipe);
    private readonly router = inject(Router);

    readonly heroActions: KzHeroAction[] = [
        { label: 'See the packages', path: this.globalService.pages.packages, icon: KzIconName.SUITCASE },
        { label: 'See the flights', path: this.globalService.pages.flights, icon: KzIconName.PLANE },
        { label: 'See the excursions', path: this.globalService.pages.excursions, icon: KzIconName.COMPASS },
    ];

    sections: KzHomeSection[] = [];
    isLoading = true;
    errorMessage = '';


    get heroTitle(): string {
        return this.globalService.APP_NAME;
    }


    get heroSubtitle(): string {
        return this.globalService.TAGLINE;
    }


    get loadingLabel(): string {
        return KZ_LABELS.loading;
    }


    get emptyLabel(): string {
        return KZ_LABELS.noResult;
    }


    ngOnInit(): void {
        this.loadHighlights();
    }


    async loadHighlights(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const [packages, flights, excursions] = await Promise.all([
                this.fetchItems<KzPackage>(this.globalService.routes.packages),
                this.fetchItems<KzFlight>(this.globalService.routes.flights),
                this.fetchItems<KzExcursion>(this.globalService.routes.excursions),
            ]);

            this.sections = [
                this.buildPackageSection(packages),
                this.buildFlightSection(flights),
                this.buildExcursionSection(excursions),
            ];
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isLoading = false;
        }
    }


    onOpen(card: KzItemCardData): void {
        this.router.navigateByUrl(this.detailPath(card));
    }


    private async fetchItems<T>(url: string): Promise<T[]> {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: this.authService.authHeaders,
        });
        const raw: unknown = await response.json();
        console.log(raw);

        const parsed = parseResponse<unknown>(raw, response.status);

        if (parsed.error !== null) {
            return [];
        }

        return parseList<T>(parsed.data);
    }


    private buildPackageSection(items: readonly KzPackage[]): KzHomeSection {
        const cards = items.slice(0, this.HIGHLIGHT_LIMIT).map((item) => ({
            id: item.id,
            type: KzItemType.PACKAGE,
            title: item.name,
            subtitle: item.destination,
            icon: KzIconName.SUITCASE,
            imageUrl: item.imageUrl,
            price: item.promoPrice > 0 ? item.promoPrice : item.price,
            unitLabel: this.PACKAGE_UNIT,
            badge: item.discountPercentage > 0 ? `-${item.discountPercentage}%` : '',
            badgeTone: KzTone.SUCCESS,
            meta: [
                { label: this.DESTINATION_LABEL, value: item.destination },
                { label: this.START_DATE_LABEL, value: this.datePipe.transformDateTime(item.startDate) },
                { label: this.END_DATE_LABEL, value: this.datePipe.transformDateTime(item.endDate) },
                { label: this.NIGHTS_LABEL, value: String(this.calculateNights(item)) },
            ],
            actionLabel: this.DISCOVER_LABEL,
            disabled: !item.available,
            disabledLabel: this.SOLD_OUT_LABEL,
        }));

        return {
            id: 'packages',
            title: this.PACKAGES_TITLE,
            subtitle: this.PACKAGES_SUBTITLE,
            linkLabel: this.SEE_ALL_LABEL,
            path: this.globalService.pages.packages,
            type: KzItemType.PACKAGE,
            icon: KzIconName.SUITCASE,
            cards,
        };
    }


    private buildFlightSection(items: readonly KzFlight[]): KzHomeSection {
        const cards = items.slice(0, this.HIGHLIGHT_LIMIT).map((item) => ({
            id: item.id,
            type: KzItemType.FLIGHT,
            title: `${item.departureCity} - ${item.arrivalCity}`,
            subtitle: `${item.airline} ${item.flightNumber}`,
            icon: KzIconName.PLANE,
            imageUrl: item.imageUrl,
            price: item.price,
            unitLabel: this.FLIGHT_UNIT,
            badge: '',
            badgeTone: KzTone.NEUTRAL,
            meta: [
                { label: this.DEPARTURE_META, value: this.datePipe.transform(item.departureTime, true) },
                { label: this.ARRIVAL_META, value: this.datePipe.transform(item.arrivalTime, true) },
            ],
            actionLabel: this.DISCOVER_LABEL,
            disabled: !item.active || item.availableSeats === 0,
            disabledLabel: this.SOLD_OUT_LABEL,
        }));

        return {
            id: 'flights',
            title: this.FLIGHTS_TITLE,
            subtitle: this.FLIGHTS_SUBTITLE,
            linkLabel: this.SEE_ALL_LABEL,
            path: this.globalService.pages.flights,
            type: KzItemType.FLIGHT,
            icon: KzIconName.PLANE,
            cards,
        };
    }


    private buildExcursionSection(items: readonly KzExcursion[]): KzHomeSection {
        const cards = items.slice(0, this.HIGHLIGHT_LIMIT).map((item) => ({
            id: item.id,
            type: KzItemType.EXCURSION,
            title: item.title,
            subtitle: item.location,
            icon: KzIconName.COMPASS,
            imageUrl: item.imageUrl,
            price: item.price,
            unitLabel: this.EXCURSION_UNIT,
            badge: '',
            badgeTone: KzTone.NEUTRAL,
            meta: [
                { label: this.LOCATION_LABEL, value: item.location },
                { label: this.DATE_LABEL, value: this.datePipe.transform(`${item.date.slice(0, 10)}T${item.startTime}`, true) },
                { label: this.DURATION_LABEL, value: this.formatDuration(item.dureeMinutes) },
                { label: this.GUIDE_LABEL, value: item.guide },
            ],
            actionLabel: this.DISCOVER_LABEL,
            disabled: !item.available,
            disabledLabel: this.SOLD_OUT_LABEL,
        }));

        return {
            id: 'excursions',
            title: this.EXCURSIONS_TITLE,
            subtitle: this.EXCURSIONS_SUBTITLE,
            linkLabel: this.SEE_ALL_LABEL,
            path: this.globalService.pages.excursions,
            type: KzItemType.EXCURSION,
            icon: KzIconName.COMPASS,
            cards,
        };
    }


    private calculateNights(item: KzPackage): number {
        const start = Date.parse(`${item.startDate.slice(0, 10)}T00:00:00Z`);
        const end = Date.parse(`${item.endDate.slice(0, 10)}T00:00:00Z`);

        if (Number.isNaN(start) || Number.isNaN(end)) {
            return item.durationNights ?? 0;
        }

        return Math.max(0, Math.round((end - start) / MS_PER_DAY));
    }


    private formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / this.MINUTES_IN_HOUR);
        const rest = minutes % this.MINUTES_IN_HOUR;

        return `${hours}h${rest > 0 ? ` ${rest}min` : ''}`;
    }


    private detailPath(card: KzItemCardData): string {
        switch (card.type) {
            case KzItemType.PACKAGE:
                return this.globalService.pages.packageDetail(card.id);
            case KzItemType.EXCURSION:
                return this.globalService.pages.excursionDetail(card.id);
            default:
                return this.globalService.pages.flightDetail(card.id);
        }
    }
}
