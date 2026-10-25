import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KzItemType } from '../../../models/kz_item_type.enum';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzOption } from '../../../models/kz_option.interface';
import { KzReservation } from '../../../models/kz_reservation.interface';
import {
    DEFAULT_KZ_RESERVATION_ADMIN_COLUMN,
    KzReservationAdminColumn,
} from '../../../models/kz_reservation_admin_column.interface';
import {
    CANCELABLE_RESERVATION_STATUSES,
    KzReservationStatus,
    REFUNDABLE_RESERVATION_STATUSES,
} from '../../../models/kz_reservation_status.enum';
import { parseList, parseResponse } from '../../../models/kz_response';
import {
    KzCellFormat,
    KzTableAction,
    KzTableActionEvent,
    KzTableRow,
} from '../../../models/kz_table.interface';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzDataTable } from '../../../components/kz-data-table/kz-data-table';
import { KzDialog } from '../../../components/kz-dialog/kz-dialog';
import { KzFilterBar } from '../../../components/kz-filter-bar/kz-filter-bar';


@Component({
    selector: 'kz-reservations-admin-page',
    standalone: true,
    imports: [KzDataTable, KzDialog, KzFilterBar],
    templateUrl: './reservations-admin-page.html',
    styleUrl: './reservations-admin-page.css',
})
export class ReservationsAdminPage implements OnInit {
    readonly PAGE_TITLE = 'Bookings';
    readonly PAGE_SUBTITLE = 'Manage bookings, cancel or refund customers.';
    readonly SEARCH_LABEL = 'Search';
    readonly SEARCH_PLACEHOLDER = 'Reference, item';
    readonly STATUS_LABEL = 'Status';
    readonly TYPE_LABEL = 'Type';
    readonly ALL_LABEL = 'All';
    readonly PENDING_OPTION = 'Pending';
    readonly CONFIRMED_OPTION = 'Confirmed';
    readonly PAID_OPTION = 'Paid';
    readonly CANCELLED_OPTION = 'Cancelled';
    readonly REFUNDED_OPTION = 'Refunded';
    readonly EXPIRED_OPTION = 'Expired';
    readonly FLIGHT_OPTION = 'Flights';
    readonly PACKAGE_OPTION = 'Packages';
    readonly EXCURSION_OPTION = 'Excursions';
    readonly REFERENCE_LABEL = 'Reference';
    readonly CLIENT_LABEL = 'Customer';
    readonly ARTICLE_LABEL = 'Item';
    readonly QUANTITY_LABEL = KZ_LABELS.quantity;
    readonly TOTAL_LABEL = KZ_LABELS.total;
    readonly STATUS_COLUMN_LABEL = KZ_LABELS.status;
    readonly DATE_LABEL = 'Date';
    readonly CANCEL_DIALOG_TITLE = 'Cancellation';
    readonly CANCEL_QUESTION = 'Cancel this booking?';
    readonly CANCEL_CONFIRM_LABEL = 'Yes, cancel';
    readonly REFUND_DIALOG_TITLE = 'Refund';
    readonly REFUND_QUESTION = 'Refund this booking?';
    readonly REFUND_CONFIRM_LABEL = 'Yes, refund';
    readonly DISMISS_LABEL = 'No, keep';
    readonly EMPTY_LABEL = KZ_LABELS.emptyReservations;
    readonly SEARCH_KEY = 'search';
    readonly STATUS_KEY = 'status';
    readonly TYPE_KEY = 'type';
    readonly TEXT_TYPE = KzFieldType.TEXT;
    readonly SELECT_TYPE = KzFieldType.SELECT;

    readonly REFERENCE_CELL_KEY = 'reference';
    readonly CLIENT_CELL_KEY = 'client';
    readonly ARTICLE_CELL_KEY = 'article';
    readonly QUANTITY_CELL_KEY = 'quantity';
    readonly TOTAL_CELL_KEY = 'total';
    readonly STATUS_CELL_KEY = 'status';
    readonly DATE_CELL_KEY = 'date';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly actions: KzTableAction[] = [];

    reservations: KzReservation[] = [];
    rows: KzTableRow[] = [];
    target: KzReservation | null = null;
    pendingAction: KzTableAction | null = null;
    search = '';
    statusFilter = '';
    typeFilter = '';
    isDialogOpen = false;
    isSubmitting = false;
    isLoading = true;
    errorMessage = '';


    get filters(): KzFilterField[] {
        return [
            {
                name: this.SEARCH_KEY,
                label: this.SEARCH_LABEL,
                type: this.TEXT_TYPE,
                value: this.search,
                placeholder: this.SEARCH_PLACEHOLDER,
                options: [],
            },
            {
                name: this.STATUS_KEY,
                label: this.STATUS_LABEL,
                type: this.SELECT_TYPE,
                value: this.statusFilter,
                placeholder: '',
                options: this.statusOptions,
            },
            {
                name: this.TYPE_KEY,
                label: this.TYPE_LABEL,
                type: this.SELECT_TYPE,
                value: this.typeFilter,
                placeholder: '',
                options: this.typeOptions,
            },
        ];
    }


    get columns(): KzReservationAdminColumn[] {
        return [
            {
                ...DEFAULT_KZ_RESERVATION_ADMIN_COLUMN,
                key: this.REFERENCE_CELL_KEY,
                label: this.REFERENCE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                ...DEFAULT_KZ_RESERVATION_ADMIN_COLUMN,
                key: this.CLIENT_CELL_KEY,
                label: this.CLIENT_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                ...DEFAULT_KZ_RESERVATION_ADMIN_COLUMN,
                key: this.ARTICLE_CELL_KEY,
                label: this.ARTICLE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                ...DEFAULT_KZ_RESERVATION_ADMIN_COLUMN,
                key: this.QUANTITY_CELL_KEY,
                label: this.QUANTITY_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                ...DEFAULT_KZ_RESERVATION_ADMIN_COLUMN,
                key: this.TOTAL_CELL_KEY,
                label: this.TOTAL_LABEL,
                format: KzCellFormat.PRICE,
            },
            {
                ...DEFAULT_KZ_RESERVATION_ADMIN_COLUMN,
                key: this.STATUS_CELL_KEY,
                label: this.STATUS_COLUMN_LABEL,
                format: KzCellFormat.STATUS,
            },
            {
                ...DEFAULT_KZ_RESERVATION_ADMIN_COLUMN,
                key: this.DATE_CELL_KEY,
                label: this.DATE_LABEL,
                format: KzCellFormat.DATE,
            },
        ];
    }


    get statusOptions(): KzOption[] {
        const options: KzOption[] = [{ label: this.ALL_LABEL, value: '' }];

        for (const status of Object.values(KzReservationStatus)) {
            options.push({ label: this.statusLabel(status), value: status });
        }

        return options;
    }


    get typeOptions(): KzOption[] {
        return [
            { label: this.ALL_LABEL, value: '' },
            { label: this.FLIGHT_OPTION, value: KzItemType.FLIGHT },
            { label: this.PACKAGE_OPTION, value: KzItemType.PACKAGE },
            { label: this.EXCURSION_OPTION, value: KzItemType.EXCURSION },
        ];
    }


    get isRefund(): boolean {
        return this.pendingAction === KzTableAction.REFUND;
    }


    get dialogTitle(): string {
        return this.isRefund ? this.REFUND_DIALOG_TITLE : this.CANCEL_DIALOG_TITLE;
    }


    get dialogMessage(): string {
        if (this.target === null) {
            return '';
        }

        const question = this.isRefund ? this.REFUND_QUESTION : this.CANCEL_QUESTION;

        return `${question} (${this.target.reference})`;
    }


    get confirmLabel(): string {
        return this.isRefund ? this.REFUND_CONFIRM_LABEL : this.CANCEL_CONFIRM_LABEL;
    }


    ngOnInit(): void {
        this.loadReservations();
    }


    onFiltersChanged(values: Record<string, string>): void {
        this.search = values[this.SEARCH_KEY] ?? '';
        this.statusFilter = values[this.STATUS_KEY] ?? '';
        this.typeFilter = values[this.TYPE_KEY] ?? '';
        this.rows = this.buildRows(this.filterReservations(this.reservations));
    }


    onFiltersReset(): void {
        this.search = '';
        this.statusFilter = '';
        this.typeFilter = '';
        this.rows = this.buildRows(this.reservations);
    }


    onActionDone(event: KzTableActionEvent): void {
        if (event.action !== KzTableAction.CANCEL && event.action !== KzTableAction.REFUND) {
            return;
        }

        const target = this.reservations.find((reservation) => reservation.id === event.rowId);

        if (target === undefined) {
            return;
        }

        this.target = target;
        this.pendingAction = event.action;
        this.errorMessage = '';
        this.isDialogOpen = true;
    }


    onCloseDialog(): void {
        if (this.isSubmitting) {
            return;
        }

        this.isDialogOpen = false;
        this.target = null;
        this.pendingAction = null;
    }


    async onConfirm(): Promise<void> {
        if (this.target === null) {
            return;
        }

        await this.applyAction(this.target, this.pendingAction);
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


    private async applyAction(reservation: KzReservation, action: KzTableAction | null): Promise<void> {
        const isRefund = action === KzTableAction.REFUND;

        this.isSubmitting = true;
        this.errorMessage = '';

        try {
            const url = isRefund
                ? this.globalService.routes.paymentRefund(reservation.id)
                : this.globalService.routes.reservationCancel(reservation.id);

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzReservation>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            const status = isRefund ? KzReservationStatus.REFUNDED : KzReservationStatus.CANCELLED;

            this.setReservations(this.reservations.map((item) =>
                item.id === reservation.id ? { ...item, status } : item));
            this.isDialogOpen = false;
            this.target = null;
            this.pendingAction = null;
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isSubmitting = false;
        }
    }


    private statusLabel(status: KzReservationStatus): string {
        switch (status) {
            case KzReservationStatus.PENDING:
                return this.PENDING_OPTION;
            case KzReservationStatus.CONFIRMED:
                return this.CONFIRMED_OPTION;
            case KzReservationStatus.PAID:
                return this.PAID_OPTION;
            case KzReservationStatus.CANCELLED:
                return this.CANCELLED_OPTION;
            case KzReservationStatus.REFUNDED:
                return this.REFUNDED_OPTION;
            default:
                return this.EXPIRED_OPTION;
        }
    }


    private setReservations(source: KzReservation[]): void {
        this.reservations = this.sortByRecent(source);
        this.rows = this.buildRows(this.filterReservations(this.reservations));
    }


    private sortByRecent(source: readonly KzReservation[]): KzReservation[] {
        return [...source].sort((first: KzReservation, second: KzReservation) => {
            const byDate = second.reservationDate.localeCompare(first.reservationDate);

            return byDate !== 0 ? byDate : second.id - first.id;
        });
    }


    private filterReservations(source: readonly KzReservation[]): KzReservation[] {
        const search = this.search.trim().toLowerCase();

        return source.filter((reservation) => {
            const matchesSearch = search.length === 0
                || reservation.reference.toLowerCase().includes(search)
                || reservation.itemLabel.toLowerCase().includes(search);
            const matchesStatus = this.statusFilter.length === 0
                || reservation.status === (this.statusFilter as KzReservationStatus);
            const matchesType = this.typeFilter.length === 0
                || reservation.typeItem === this.typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }


    private buildRows(source: readonly KzReservation[]): KzTableRow[] {
        return source.map((reservation) => ({
            id: reservation.id,
            cells: {
                [this.REFERENCE_CELL_KEY]: reservation.reference,
                [this.CLIENT_CELL_KEY]: reservation.userId,
                [this.ARTICLE_CELL_KEY]: `${reservation.typeItem} - ${reservation.itemLabel}`,
                [this.QUANTITY_CELL_KEY]: reservation.quantity,
                [this.TOTAL_CELL_KEY]: reservation.totalAmount,
                [this.STATUS_CELL_KEY]: reservation.status,
                [this.DATE_CELL_KEY]: reservation.reservationDate,
            },
            actions: this.actionsFor(reservation.status),
        }));
    }


    private actionsFor(status: KzReservationStatus): KzTableAction[] {
        const actions: KzTableAction[] = [];

        if (CANCELABLE_RESERVATION_STATUSES.includes(status)) {
            actions.push(KzTableAction.CANCEL);
        }

        if (REFUNDABLE_RESERVATION_STATUSES.includes(status)) {
            actions.push(KzTableAction.REFUND);
        }

        return actions;
    }
}