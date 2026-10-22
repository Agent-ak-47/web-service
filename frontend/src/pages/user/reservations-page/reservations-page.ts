import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzReservation } from '../../../models/kz_reservation.interface';
import {
    CANCELABLE_RESERVATION_STATUSES,
    KzReservationStatus,
    PAYABLE_RESERVATION_STATUSES,
} from '../../../models/kz_reservation_status.enum';
import { parseList, parseResponse } from '../../../models/kz_response';
import {
    KzCellFormat,
    KzTableAction,
    KzTableActionEvent,
    KzTableRow,
} from '../../../models/kz_table.interface';
import { KzMoneyPipe } from '../../../pipes/kz-money.pipe';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzBtn } from '../../../components/kz-btn/kz-btn';
import { KzDataTable } from '../../../components/kz-data-table/kz-data-table';
import { KzDialog } from '../../../components/kz-dialog/kz-dialog';
import {
    DEFAULT_KZ_RESERVATION_COLUMN,
    KzReservationColumn,
} from './models/kz_reservation_column.interface';


@Component({
    selector: 'kz-reservations-page',
    standalone: true,
    imports: [KzBtn, KzDataTable, KzDialog, KzMoneyPipe],
    templateUrl: './reservations-page.html',
    styleUrl: './reservations-page.css',
})
export class ReservationsPage implements OnInit {
    readonly PAGE_TITLE = 'My bookings';
    readonly PAGE_SUBTITLE = 'Track your bookings and settle the pending payments.';
    readonly REFERENCE_LABEL = 'Reference';
    readonly ITEM_LABEL = 'Item';
    readonly DATE_LABEL = 'Booking date';
    readonly QUANTITY_LABEL = KZ_LABELS.quantity;
    readonly TOTAL_LABEL = KZ_LABELS.total;
    readonly STATUS_LABEL = KZ_LABELS.status;
    readonly EMPTY_LABEL = KZ_LABELS.emptyReservations;
    readonly PAYABLE_TITLE = 'Bookings to pay';
    readonly PAY_LABEL = 'Pay';
    readonly PAY_KIND = KzBtnKind.PRIMARY;
    readonly REMOVE_LABEL = 'Cancel';
    readonly REMOVE_KIND = KzBtnKind.SECONDARY;
    readonly DIALOG_TITLE = KZ_LABELS.cancel;
    readonly CANCEL_QUESTION = 'Cancel this booking?';
    readonly DEFAULT_CANCEL_REASON = 'Cancelled by the customer';

    readonly REFERENCE_KEY = 'reference';
    readonly ITEM_KEY = 'item';
    readonly QUANTITY_KEY = 'quantity';
    readonly TOTAL_KEY = 'total';
    readonly STATUS_KEY = 'status';
    readonly DATE_KEY = 'date';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly actions: KzTableAction[] = [];

    reservations: KzReservation[] = [];
    rows: KzTableRow[] = [];
    cancelReason = '';
    cancelTarget: KzReservation | null = null;
    isDialogOpen = false;
    isCancelling = false;
    isLoading = true;
    errorMessage = '';


    get columns(): KzReservationColumn[] {
        return [
            {
                ...DEFAULT_KZ_RESERVATION_COLUMN,
                key: this.REFERENCE_KEY,
                label: this.REFERENCE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                ...DEFAULT_KZ_RESERVATION_COLUMN,
                key: this.ITEM_KEY,
                label: this.ITEM_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                ...DEFAULT_KZ_RESERVATION_COLUMN,
                key: this.QUANTITY_KEY,
                label: this.QUANTITY_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                ...DEFAULT_KZ_RESERVATION_COLUMN,
                key: this.TOTAL_KEY,
                label: this.TOTAL_LABEL,
                format: KzCellFormat.PRICE,
            },
            {
                ...DEFAULT_KZ_RESERVATION_COLUMN,
                key: this.STATUS_KEY,
                label: this.STATUS_LABEL,
                format: KzCellFormat.STATUS,
            },
            {
                ...DEFAULT_KZ_RESERVATION_COLUMN,
                key: this.DATE_KEY,
                label: this.DATE_LABEL,
                format: KzCellFormat.DATE,
            },
        ];
    }


    get payableReservations(): KzReservation[] {
        return this.reservations.filter((reservation) =>
            PAYABLE_RESERVATION_STATUSES.includes(reservation.status));
    }


    get dialogMessage(): string {
        if (this.cancelTarget === null) {
            return '';
        }

        return `${this.CANCEL_QUESTION} (${this.cancelTarget.reference})`;
    }


    ngOnInit(): void {
        this.loadReservations();
    }


    onActionDone(event: KzTableActionEvent): void {
        if (event.action !== KzTableAction.CANCEL) {
            return;
        }

        const target = this.reservations.find((reservation) => reservation.id === event.rowId);

        if (target === undefined) {
            return;
        }

        this.openCancel(target);
    }


    onRemove(reservation: KzReservation): void {
        if (this.isCancelling) {
            return;
        }

        this.openCancel(reservation);
    }


    onCloseDialog(): void {
        if (this.isCancelling) {
            return;
        }

        this.isDialogOpen = false;
        this.cancelTarget = null;
        this.cancelReason = '';
    }


    onConfirmCancel(): void {
        if (this.cancelTarget === null) {
            return;
        }

        this.cancelReservation(this.cancelTarget);
    }


    onPay(reservation: KzReservation): void {
        this.authService.savePendingReservation(reservation);
        this.router.navigateByUrl(this.globalService.pages.payment);
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


    private openCancel(reservation: KzReservation): void {
        this.cancelTarget = reservation;
        this.cancelReason = this.DEFAULT_CANCEL_REASON;
        this.errorMessage = '';
        this.isDialogOpen = true;
    }


    private async cancelReservation(reservation: KzReservation): Promise<void> {
        this.isCancelling = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.reservationCancel(reservation.id), {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify({ reason: this.cancelReason }),
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

            this.setReservations(this.reservations.map((item) =>
                item.id === reservation.id
                    ? {
                        ...item,
                        status: KzReservationStatus.CANCELLED,
                        cancellationReason: this.cancelReason,
                    }
                    : item));
            this.dropPendingReservation(reservation.id);
            this.isDialogOpen = false;
            this.cancelTarget = null;
            this.cancelReason = '';
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isCancelling = false;
        }
    }


    private dropPendingReservation(reservationId: number): void {
        if (this.authService.pendingReservation.id !== reservationId) {
            return;
        }

        this.authService.clearPendingReservation();
    }


    private setReservations(source: KzReservation[]): void {
        this.reservations = this.sortByRecent(source);
        this.rows = this.buildRows(this.reservations);
    }


    private sortByRecent(source: readonly KzReservation[]): KzReservation[] {
        return [...source].sort((first: KzReservation, second: KzReservation) => {
            const byDate = second.reservationDate.localeCompare(first.reservationDate);

            return byDate !== 0 ? byDate : second.id - first.id;
        });
    }


    private buildRows(source: readonly KzReservation[]): KzTableRow[] {
        return source.map((reservation) => {
            const cancelable = CANCELABLE_RESERVATION_STATUSES.includes(reservation.status);

            return {
                id: reservation.id,
                cells: {
                    [this.REFERENCE_KEY]: reservation.reference,
                    [this.ITEM_KEY]: `${reservation.typeItem} - ${reservation.itemLabel}`,
                    [this.QUANTITY_KEY]: reservation.quantity,
                    [this.TOTAL_KEY]: reservation.totalAmount,
                    [this.STATUS_KEY]: reservation.status,
                    [this.DATE_KEY]: reservation.reservationDate,
                },
                actions: cancelable ? [KzTableAction.CANCEL] : [],
            };
        });
    }
}
