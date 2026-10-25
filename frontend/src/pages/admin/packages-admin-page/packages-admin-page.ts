import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzPackage } from '../../../models/kz_package.interface';
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
import { KzFilterBar } from '../../../components/kz-filter-bar/kz-filter-bar';


@Component({
    selector: 'kz-packages-admin-page',
    standalone: true,
    imports: [KzBtn, KzDataTable, KzDialog, KzFilterBar],
    templateUrl: './packages-admin-page.html',
    styleUrl: './packages-admin-page.css',
})
export class PackagesAdminPage implements OnInit {
    readonly PAGE_TITLE = 'Packages';
    readonly PAGE_SUBTITLE = 'Create, edit and delete the catalog packages.';
    readonly SEARCH_LABEL = 'Search';
    readonly SEARCH_PLACEHOLDER = 'Name, destination';
    readonly SEARCH_KEY = 'search';
    readonly NEW_LABEL = 'New package';
    readonly ACTIVE_LABEL = 'Active';
    readonly NAME_LABEL = 'Name';
    readonly DESTINATION_LABEL = 'Destination';
    readonly DATES_COLUMN_LABEL = 'Dates';
    readonly DURATION_LABEL = 'Nights';
    readonly PRICE_LABEL = 'Price';
    readonly DISCOUNT_LABEL = 'Discount';
    readonly EMPTY_LABEL = KZ_LABELS.emptyList;
    readonly DIALOG_TITLE = 'Delete';
    readonly REMOVE_QUESTION = 'Delete this package?';
    readonly PRIMARY_KIND = KzBtnKind.PRIMARY;

    readonly NAME_KEY = 'name';
    readonly DESTINATION_KEY = 'destination';
    readonly DATES_KEY = 'dates';
    readonly DURATION_KEY = 'duration';
    readonly PRICE_KEY = 'price';
    readonly DISCOUNT_KEY = 'discount';
    readonly ACTIVE_KEY = 'active';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly actions: KzTableAction[] = [KzTableAction.EDIT, KzTableAction.REMOVE];

    packages: KzPackage[] = [];
    rows: KzTableRow[] = [];
    removeTarget: KzPackage | null = null;
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
                key: this.NAME_KEY,
                label: this.NAME_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.DESTINATION_KEY,
                label: this.DESTINATION_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.DATES_KEY,
                label: this.DATES_COLUMN_LABEL,
                format: KzCellFormat.DATE,
            },
            {
                key: this.DURATION_KEY,
                label: this.DURATION_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                key: this.PRICE_KEY,
                label: this.PRICE_LABEL,
                format: KzCellFormat.PRICE,
            },
            {
                key: this.DISCOUNT_KEY,
                label: this.DISCOUNT_LABEL,
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

        return `${this.REMOVE_QUESTION} (${this.removeTarget.name})`;
    }


    ngOnInit(): void {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.applyQueryParams(params);
                void this.loadPackages();
            });
    }


    onNewPackage(): void {
        this.router.navigateByUrl(this.globalService.pages.adminPackageForm);
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
        const target = this.packages.find((item) => item.id === event.rowId);

        if (target === undefined) {
            return;
        }

        if (event.action === KzTableAction.EDIT) {
            this.router.navigateByUrl(this.globalService.pages.adminPackageFormEdit(target.id));

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

        await this.deletePackage(this.removeTarget);
    }


    async loadPackages(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(addQuery(this.globalService.routes.packages, this.queryParams()), {
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
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isLoading = false;
        }
    }


    private async deletePackage(item: KzPackage): Promise<void> {
        this.isDeleting = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.package(item.id), {
                method: 'DELETE',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzPackage>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            this.setPackages(this.packages.filter((entry) => entry.id !== item.id));
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


    private setPackages(source: KzPackage[]): void {
        this.packages = source;
        this.rows = this.buildRows(source);
    }


    private buildRows(source: readonly KzPackage[]): KzTableRow[] {
        return source.map((item) => ({
            id: item.id,
            cells: {
                [this.NAME_KEY]: item.name,
                [this.DESTINATION_KEY]: item.destination,
                [this.DATES_KEY]: item.startDate,
                [this.DURATION_KEY]: item.durationNights,
                [this.PRICE_KEY]: item.price,
                [this.DISCOUNT_KEY]: item.discountPercentage,
                [this.ACTIVE_KEY]: item.available,
            },
        }));
    }
}