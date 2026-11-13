import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzExcursion } from '../../../models/kz_excursion.interface';
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


@Component({
    selector: 'kz-excursions-admin-page',
    standalone: true,
    imports: [KzBtn, KzDataTable, KzDialog, KzErrorPopup],
    templateUrl: './excursions-admin-page.html',
    styleUrl: './excursions-admin-page.css',
})
export class ExcursionsAdminPage implements OnInit {
    readonly PAGE_TITLE = 'Excursions';
    readonly PAGE_SUBTITLE = 'Create, edit and delete the catalog excursions.';
    readonly SEARCH_KEY = 'search';
    readonly SEARCH_PAGE_LABEL = 'Search excursions';
    readonly NEW_LABEL = 'New excursion';
    readonly ACTIVE_LABEL = 'Active';
    readonly TITLE_LABEL = 'Title';
    readonly LOCATION_LABEL = 'Location';
    readonly DATE_LABEL = 'Date';
    readonly DURATION_LABEL = 'Duration';
    readonly GUIDE_LABEL = 'Guide';
    readonly PRICE_LABEL = 'Price';
    readonly CAPACITY_LABEL = 'Total seats';
    readonly AVAILABLE_COLUMN_LABEL = 'Available';
    readonly EMPTY_LABEL = KZ_LABELS.emptyList;
    readonly DIALOG_TITLE = 'Delete';
    readonly REMOVE_QUESTION = 'Delete this excursion?';
    readonly PRIMARY_KIND = KzBtnKind.PRIMARY;

    readonly TITLE_KEY = 'title';
    readonly LOCATION_KEY = 'location';
    readonly DATE_KEY = 'date';
    readonly DURATION_KEY = 'duration';
    readonly GUIDE_KEY = 'guide';
    readonly PRICE_KEY = 'price';
    readonly CAPACITY_KEY = 'capacity';
    readonly AVAILABLE_SEATS_KEY = 'availableSeats';
    readonly ACTIVE_KEY = 'active';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly actions: KzTableAction[] = [KzTableAction.EDIT, KzTableAction.REMOVE];

    excursions: KzExcursion[] = [];
    rows: KzTableRow[] = [];
    removeTarget: KzExcursion | null = null;
    search = '';
    isLoading = true;
    isDeleting = false;
    isDialogOpen = false;
    errorMessage = '';


    get columns(): KzTableColumn[] {
        return [
            {
                key: this.TITLE_KEY,
                label: this.TITLE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.LOCATION_KEY,
                label: this.LOCATION_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.DATE_KEY,
                label: this.DATE_LABEL,
                format: KzCellFormat.DATE,
            },
            {
                key: this.DURATION_KEY,
                label: this.DURATION_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                key: this.GUIDE_KEY,
                label: this.GUIDE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.PRICE_KEY,
                label: this.PRICE_LABEL,
                format: KzCellFormat.PRICE,
            },
            {
                key: this.CAPACITY_KEY,
                label: this.CAPACITY_LABEL,
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

        return `${this.REMOVE_QUESTION} (${this.removeTarget.title})`;
    }


    ngOnInit(): void {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.applyQueryParams(params);
                void this.loadExcursions();
            });
    }


    onNewExcursion(): void {
        this.router.navigateByUrl(this.globalService.pages.adminExcursionForm);
    }


    onSearch(): void {
        this.router.navigateByUrl(this.globalService.pages.adminExcursionsSearch);
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
        const target = this.excursions.find((item) => item.id === event.rowId);

        if (target === undefined) {
            return;
        }

        if (event.action === KzTableAction.EDIT) {
            this.router.navigateByUrl(this.globalService.pages.adminExcursionFormEdit(target.id));

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

        await this.deleteExcursion(this.removeTarget);
    }


    async loadExcursions(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(addQuery(this.globalService.routes.excursions, this.queryParams()), {
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

            this.setExcursions(parseList<KzExcursion>(parsed.data));
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isLoading = false;
        }
    }


    private async deleteExcursion(item: KzExcursion): Promise<void> {
        this.isDeleting = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.excursion(item.id), {
                method: 'DELETE',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzExcursion>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            this.setExcursions(this.excursions.filter((entry) => entry.id !== item.id));
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


    private setExcursions(source: KzExcursion[]): void {
        this.excursions = source;
        this.rows = this.buildRows(source);
    }


    private buildRows(source: readonly KzExcursion[]): KzTableRow[] {
        return source.map((item) => ({
            id: item.id,
            cells: {
                [this.TITLE_KEY]: item.title,
                [this.LOCATION_KEY]: item.location,
                [this.DATE_KEY]: item.date,
                [this.DURATION_KEY]: item.dureeMinutes,
                [this.GUIDE_KEY]: item.guide,
                [this.PRICE_KEY]: item.price,
                [this.CAPACITY_KEY]: item.capacity,
                [this.AVAILABLE_SEATS_KEY]: item.availableSeats,
                [this.ACTIVE_KEY]: item.available,
            },
        }));
    }
}