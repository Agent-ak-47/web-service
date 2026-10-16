import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzDashboardStat } from '../../../models/kz_dashboard_stat.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzIconRef } from '../../../models/kz_icon_ref.interface';
import { KzIconSize } from '../../../models/kz_icon_size.enum';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzReservation } from '../../../models/kz_reservation.interface';
import { KzReservationStatus } from '../../../models/kz_reservation_status.enum';
import { parseList, parseResponse } from '../../../models/kz_response';
import { KzCellFormat, KzTableColumn, KzTableRow } from '../../../models/kz_table.interface';
import { KzTone } from '../../../models/kz_tone.enum';
import { KzMoneyPipe } from '../../../pipes/kz-money.pipe';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzBtn } from '../../../components/kz-btn/kz-btn';
import { KzDataTable } from '../../../components/kz-data-table/kz-data-table';
import { KzLoading } from '../../../components/kz-loading/kz-loading';
import { Stat } from './components/stat/stat';
import { KzDashboardLink } from './models/kz_dashboard_link.interface';


@Component({
    selector: 'kz-dashboard-page',
    standalone: true,
    imports: [KzBtn, KzDataTable, KzLoading, Stat],
    templateUrl: './dashboard-page.html',
    styleUrl: './dashboard-page.css',
})
export class DashboardPage implements OnInit {
    readonly PAGE_TITLE = 'Tableau de bord';
    readonly PAGE_SUBTITLE = 'Vue d ensemble des reservations et des catalogues.';
    readonly RECENT_TITLE = 'Dernieres reservations';
    readonly RECENT_LIMIT = 5;
    readonly TOTAL_LABEL = 'Reservations';
    readonly PAID_LABEL = 'Payees';
    readonly CANCELLED_LABEL = 'Annulees';
    readonly REVENUE_LABEL = 'Chiffre d affaires';
    readonly TOTAL_HINT = 'Toutes reservations';
    readonly PAID_HINT = 'Paiements confirmes';
    readonly CANCELLED_HINT = 'Reservations annulees';
    readonly REVENUE_HINT = 'Total des reservations payees';
    readonly FLIGHTS_LINK_LABEL = 'Gerer les vols';
    readonly PACKAGES_LINK_LABEL = 'Gerer les forfaits';
    readonly EXCURSIONS_LINK_LABEL = 'Gerer les excursions';
    readonly RESERVATIONS_LINK_LABEL = 'Gerer les reservations';
    readonly REFERENCE_LABEL = 'Reference';
    readonly ARTICLE_LABEL = 'Article';
    readonly TOTAL_COLUMN_LABEL = KZ_LABELS.total;
    readonly STATUS_LABEL = KZ_LABELS.status;
    readonly DATE_LABEL = 'Date';
    readonly EMPTY_LABEL = KZ_LABELS.emptyReservations;
    readonly LOADING_LABEL = KZ_LABELS.loading;
    readonly SECONDARY_KIND = KzBtnKind.SECONDARY;
    readonly LINK_ICON_SIZE = KzIconSize.MD;
    readonly LINK_ICON_TONE = KzTone.NEUTRAL;

    readonly REFERENCE_KEY = 'reference';
    readonly ARTICLE_KEY = 'article';
    readonly TOTAL_KEY = 'total';
    readonly STATUS_KEY = 'status';
    readonly DATE_KEY = 'date';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly moneyPipe = inject(KzMoneyPipe);
    private readonly router = inject(Router);

    readonly links: KzDashboardLink[] = [
        {
            label: this.FLIGHTS_LINK_LABEL,
            path: this.globalService.pages.adminFlights,
            icon: this.linkIcon(KzIconName.PLANE),
        },
        {
            label: this.PACKAGES_LINK_LABEL,
            path: this.globalService.pages.adminPackages,
            icon: this.linkIcon(KzIconName.SUITCASE),
        },
        {
            label: this.EXCURSIONS_LINK_LABEL,
            path: this.globalService.pages.adminExcursions,
            icon: this.linkIcon(KzIconName.COMPASS),
        },
        {
            label: this.RESERVATIONS_LINK_LABEL,
            path: this.globalService.pages.adminReservations,
            icon: this.linkIcon(KzIconName.RECEIPT),
        },
    ];

    reservations: KzReservation[] = [];
    stats: KzDashboardStat[] = [];
    recentRows: KzTableRow[] = [];
    isLoading = true;
    errorMessage = '';


    get columns(): KzTableColumn[] {
        return [
            {
                key: this.REFERENCE_KEY,
                label: this.REFERENCE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.ARTICLE_KEY,
                label: this.ARTICLE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.TOTAL_KEY,
                label: this.TOTAL_COLUMN_LABEL,
                format: KzCellFormat.PRICE,
            },
            {
                key: this.STATUS_KEY,
                label: this.STATUS_LABEL,
                format: KzCellFormat.STATUS,
            },
            {
                key: this.DATE_KEY,
                label: this.DATE_LABEL,
                format: KzCellFormat.DATE,
            },
        ];
    }


    ngOnInit(): void {
        this.loadReservations();
    }


    goTo(path: string): void {
        this.router.navigateByUrl(path);
    }


    async loadReservations(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.reservations, {
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

            this.setReservations(parseList<KzReservation>(parsed.data));
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isLoading = false;
        }
    }


    private linkIcon(name: KzIconName): KzIconRef {
        return {
            name,
            size: this.LINK_ICON_SIZE,
            tone: this.LINK_ICON_TONE,
        };
    }


    private setReservations(source: KzReservation[]): void {
        this.reservations = source;
        this.stats = this.buildStats(source);
        this.recentRows = this.buildRows(this.buildRecent(source));
    }


    private buildStats(source: readonly KzReservation[]): KzDashboardStat[] {
        const paid = source.filter((reservation) =>
            reservation.status === KzReservationStatus.PAID);
        const cancelled = source.filter((reservation) =>
            reservation.status === KzReservationStatus.CANCELLED).length;
        const revenue = paid.reduce((total: number, reservation: KzReservation) =>
            total + reservation.totalAmount, 0);

        return [
            {
                label: this.TOTAL_LABEL,
                value: String(source.length),
                hint: this.TOTAL_HINT,
                icon: KzIconName.RECEIPT,
                tone: KzTone.NEUTRAL,
            },
            {
                label: this.PAID_LABEL,
                value: String(paid.length),
                hint: this.PAID_HINT,
                icon: KzIconName.CHECK,
                tone: KzTone.SUCCESS,
            },
            {
                label: this.CANCELLED_LABEL,
                value: String(cancelled),
                hint: this.CANCELLED_HINT,
                icon: KzIconName.CLOSE,
                tone: KzTone.DANGER,
            },
            {
                label: this.REVENUE_LABEL,
                value: this.moneyPipe.transform(revenue),
                hint: this.REVENUE_HINT,
                icon: KzIconName.CARD,
                tone: KzTone.SUCCESS,
            },
        ];
    }


    private buildRecent(source: readonly KzReservation[]): KzReservation[] {
        return [...source]
            .sort((first: KzReservation, second: KzReservation) =>
                second.reservationDate.localeCompare(first.reservationDate))
            .slice(0, this.RECENT_LIMIT);
    }


    private buildRows(source: readonly KzReservation[]): KzTableRow[] {
        return source.map((reservation) => ({
            id: reservation.id,
            cells: {
                [this.REFERENCE_KEY]: reservation.reference,
                [this.ARTICLE_KEY]: `${reservation.typeItem} - ${reservation.itemLabel}`,
                [this.TOTAL_KEY]: reservation.totalAmount,
                [this.STATUS_KEY]: reservation.status,
                [this.DATE_KEY]: reservation.reservationDate,
            },
        }));
    }
}