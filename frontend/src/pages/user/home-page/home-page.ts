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
import { KzLoading } from '../../../components/kz-loading/kz-loading';
import { KzHeroAction } from './components/hero/hero_action.interface';
import { Hero } from './components/hero/hero';
import { KzHomeSection } from './models/kz_home_section.interface';


@Component({
    selector: 'kz-home-page',
    standalone: true,
    imports: [Hero, KzCard, KzLoading, RouterLink],
    templateUrl: './home-page.html',
    styleUrl: './home-page.css',
})
export class HomePage implements OnInit {
    readonly HIGHLIGHT_LIMIT = 3;
    readonly SEE_ALL_LABEL = 'Voir tout';
    readonly PACKAGES_TITLE = 'Forfaits';
    readonly PACKAGES_SUBTITLE = 'Sejours complets vols et excursions inclus.';
    readonly FLIGHTS_TITLE = 'Vols';
    readonly FLIGHTS_SUBTITLE = 'Les prochains departs au meilleur prix.';
    readonly EXCURSIONS_TITLE = 'Excursions';
    readonly EXCURSIONS_SUBTITLE = 'Decouvrez la destination avec un guide local.';
    readonly NIGHTS_LABEL = 'Nuits';
    readonly DESTINATION_LABEL = 'Destination';
    readonly DATES_LABEL = 'Dates';
    readonly GUIDE_LABEL = 'Guide';
    readonly LOCATION_LABEL = 'Lieu';
    readonly DATE_LABEL = 'Date';
    readonly DURATION_LABEL = 'Duree';
    readonly PACKAGE_UNIT = 'par personne';
    readonly EXCURSION_UNIT = 'par personne';
    readonly FLIGHT_UNIT = 'par passager';
    readonly DEPARTURE_META = 'Depart';
    readonly ARRIVAL_META = 'Arrivee';
    readonly DISCOVER_LABEL = 'Decouvrir';
    readonly SOLD_OUT_LABEL = 'Complet';
    readonly MINUTES_IN_HOUR = 60;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly datePipe = inject(KzDatePipe);
    private readonly router = inject(Router);

    readonly heroActions: KzHeroAction[] = [
        { label: 'Voir les forfaits', path: this.globalService.pages.packages, icon: KzIconName.SUITCASE },
        { label: 'Voir les vols', path: this.globalService.pages.flights, icon: KzIconName.PLANE },
        { label: 'Voir les excursions', path: this.globalService.pages.excursions, icon: KzIconName.COMPASS },
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


    onReserve(card: KzItemCardData): void {
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
                { label: this.DATES_LABEL, value: `${this.datePipe.transform(item.startDate)} - ${this.datePipe.transform(item.endDate)}` },
                { label: this.NIGHTS_LABEL, value: String(item.durationNights) },
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
            imageUrl: '',
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
            imageUrl: '',
            price: item.price,
            unitLabel: this.EXCURSION_UNIT,
            badge: '',
            badgeTone: KzTone.NEUTRAL,
            meta: [
                { label: this.LOCATION_LABEL, value: item.location },
                { label: this.DATE_LABEL, value: `${this.datePipe.transform(item.date)} ${this.datePipe.transform(item.startTime, true).slice(-5)}` },
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
