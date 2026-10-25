import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KzFlight } from '../../../models/kz_flight.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { addQuery, cleanQueryParams, KzQueryParams } from '../../../models/kz_query';
import { parseList, parseResponse } from '../../../models/kz_response';
import {
    KzCellFormat,
    KzTableAction,
    KzTableActionEvent,
    KzTableColumn,
    KzTableRow,
} from '../../../models/kz_table.interface';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzBtn } from '../../../components/kz-btn/kz-btn';
import { KzDataTable } from '../../../components/kz-data-table/kz-data-table';
import { KzDialog } from '../../../components/kz-dialog/kz-dialog';
import { KzErrorPopup } from '../../../components/kz-error-popup/kz-error-popup';
import { KzFilterBar } from '../../../components/kz-filter-bar/kz-filter-bar';


@Component({
    selector: 'kz-flights-admin-page',
    standalone: true,
    imports: [KzBtn, KzDataTable, KzDialog, KzErrorPopup, KzFilterBar],
    templateUrl: './flights-admin-page.html',
    styleUrl: './flights-admin-page.css',
})
export class FlightsAdminPage implements OnInit {
    readonly PAGE_TITLE = 'Flights';
    readonly PAGE_SUBTITLE = 'Create, edit and delete the catalog flights.';
    readonly SEARCH_LABEL = 'Search';
    readonly SEARCH_PLACEHOLDER = 'Airline, number, city';
    readonly SEARCH_KEY = 'search';
    readonly NEW_LABEL = 'New flight';
    readonly ACTIVE_LABEL = 'Active';
    readonly AIRLINE_LABEL = 'Airline';
    readonly FLIGHT_NUMBER_LABEL = 'Number';
    readonly TOTAL_SEATS_LABEL = 'Total seats';
    readonly PRICE_LABEL = 'Price';
    readonly ROUTE_LABEL = 'Departure';
    readonly DEPARTURE_COLUMN_LABEL = 'Departs on';
    readonly AVAILABLE_COLUMN_LABEL = 'Available';
    readonly EMPTY_LABEL = KZ_LABELS.emptyList;
    readonly DIALOG_TITLE = 'Delete';
    readonly REMOVE_QUESTION = 'Delete this flight?';
    readonly PRIMARY_KIND = KzBtnKind.PRIMARY;

    readonly NUMBER_KEY = 'number';
    readonly COMPANY_KEY = 'company';
    readonly ROUTE_KEY = 'route';
    readonly DEPARTURE_KEY = 'departure';
    readonly PRICE_KEY = 'price';
    readonly TOTAL_SEATS_KEY = 'totalSeats';
    readonly AVAILABLE_SEATS_KEY = 'availableSeats';
    readonly ACTIVE_KEY = 'active';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly actions: KzTableAction[] = [KzTableAction.EDIT, KzTableAction.REMOVE];

    flights: KzFlight[] = [];
    rows: KzTableRow[] = [];
    removeTarget: KzFlight | null = null;
    search = '';
    isLoading = true;
    isDeleting = false;
    isDialogOpen = false;
    errorMessage = '';


    get filters(): KzFilterField[] {
        return [
            {
                name: this.SEARCH_KEY,
                label: this.SEARCH_LABEL,
                type: KzFieldType.TEXT,
                value: this.search,
                placeholder: this.SEARCH_PLACEHOLDER,
                options: [],
            },
        ];
    }


    get columns(): KzTableColumn[] {
        return [
            {
                key: this.NUMBER_KEY,
                label: this.FLIGHT_NUMBER_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.COMPANY_KEY,
                label: this.AIRLINE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.ROUTE_KEY,
                label: this.ROUTE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.DEPARTURE_KEY,
                label: this.DEPARTURE_COLUMN_LABEL,
                format: KzCellFormat.DATE,
            },
            {
                key: this.PRICE_KEY,
                label: this.PRICE_LABEL,
                format: KzCellFormat.PRICE,
            },
            {
                key: this.TOTAL_SEATS_KEY,
                label: this.TOTAL_SEATS_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                key: this.AVAILABLE_SEATS_KEY,
                label: this.AVAILABLE_COLUMN_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                key: this.ACTIVE_KEY,
                label: this.ACTIVE_LABEL,
                format: KzCellFormat.BOOLEAN,
            },
        ];
    }


    get dialogMessage(): string {
        if (this.removeTarget === null) {
            return '';
        }

        return `${this.REMOVE_QUESTION} (${this.removeTarget.flightNumber})`;
    }


    ngOnInit(): void {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.applyQueryParams(params);
                void this.loadFlights();
            });
    }


    onNewFlight(): void {
        this.router.navigateByUrl(this.globalService.pages.adminFlightForm);
    }


    onSearchChanged(values: Record<string, string>): void {
        this.search = values[this.SEARCH_KEY] ?? '';
    }


    async onSearchSubmitted(): Promise<void> {
        await this.router.navigate([], {
            relativeTo: this.route,
            queryParams: this.queryParams(),
        });
    }


    async onSearchReset(): Promise<void> {
        this.search = '';
        await this.onSearchSubmitted();
    }


    onActionDone(event: KzTableActionEvent): void {
        const target = this.flights.find((flight) => flight.id === event.rowId);

        if (target === undefined) {
            return;
        }

        if (event.action === KzTableAction.EDIT) {
            this.router.navigateByUrl(this.globalService.pages.adminFlightFormEdit(target.id));

            return;
        }

        this.removeTarget = target;
        this.errorMessage = '';
        this.isDialogOpen = true;
    }


    onCloseDialog(): void {
        if (this.isDeleting) {
            return;
        }

        this.isDialogOpen = false;
        this.removeTarget = null;
    }


    async onConfirmRemove(): Promise<void> {
        if (this.removeTarget === null) {
            return;
        }

        await this.deleteFlight(this.removeTarget);
    }


    async loadFlights(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(addQuery(this.globalService.routes.flights, this.queryParams()), {
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

            this.setFlights(parseList<KzFlight>(parsed.data));
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isLoading = false;
        }
    }


    private async deleteFlight(flight: KzFlight): Promise<void> {
        this.isDeleting = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.flight(flight.id), {
                method: 'DELETE',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzFlight>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            this.setFlights(this.flights.filter((item) => item.id !== flight.id));
            this.isDialogOpen = false;
            this.removeTarget = null;
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isDeleting = false;
        }
    }


    private applyQueryParams(params: ParamMap): void {
        this.search = params.get(this.SEARCH_KEY) ?? '';
    }


    private queryParams(): KzQueryParams {
        return cleanQueryParams({ [this.SEARCH_KEY]: this.search });
    }


    private setFlights(source: KzFlight[]): void {
        this.flights = source;
        this.rows = this.buildRows(source);
    }


    private buildRows(source: readonly KzFlight[]): KzTableRow[] {
        return source.map((flight) => ({
            id: flight.id,
            cells: {
                [this.NUMBER_KEY]: flight.flightNumber,
                [this.COMPANY_KEY]: flight.airline,
                [this.ROUTE_KEY]: `${flight.departureCity} - ${flight.arrivalCity}`,
                [this.DEPARTURE_KEY]: flight.departureTime,
                [this.PRICE_KEY]: flight.price,
                [this.TOTAL_SEATS_KEY]: flight.totalSeats,
                [this.AVAILABLE_SEATS_KEY]: flight.availableSeats,
                [this.ACTIVE_KEY]: flight.active,
            },
        }));
    }
}