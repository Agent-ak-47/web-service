import { Component, inject, input, output } from '@angular/core';

import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzIconRef } from '../../models/kz_icon_ref.interface';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KZ_LABELS } from '../../models/kz_labels.interface';
import { KzTone } from '../../models/kz_tone.enum';
import {
    KzCellFormat,
    KzTableAction,
    KzTableActionEvent,
    KzTableColumn,
    KzTableRow,
} from '../../models/kz_table.interface';
import { KzDatePipe } from '../../pipes/kz-date.pipe';
import { KzMoneyPipe } from '../../pipes/kz-money.pipe';
import { KzBtn } from '../kz-btn/kz-btn';
import { KzLoading } from '../kz-loading/kz-loading';
import { KzStatusTag } from '../kz-status-tag/kz-status-tag';


@Component({
    selector: 'kz-data-table',
    standalone: true,
    imports: [KzBtn, KzLoading, KzStatusTag],
    templateUrl: './kz-data-table.html',
    styleUrl: './kz-data-table.css',
})
export class KzDataTable {
    readonly CELL_FORMAT = KzCellFormat;
    readonly RIGHT_ALIGNED_FORMATS: readonly KzCellFormat[] = [KzCellFormat.PRICE, KzCellFormat.NUMBER];
    readonly ACTION_ICON_SIZE = KzIconSize.SM;
    readonly ACTION_ICON_TONE = KzTone.NEUTRAL;
    readonly DANGER_ACTIONS: readonly KzTableAction[] = [KzTableAction.REMOVE, KzTableAction.CANCEL];
    readonly GHOST_KIND = KzBtnKind.GHOST;
    readonly SECONDARY_KIND = KzBtnKind.SECONDARY;
    readonly LOADING_LABEL = KZ_LABELS.loading;
    readonly EMPTY_LABEL = KZ_LABELS.emptyList;
    readonly YES_LABEL = 'Oui';
    readonly NO_LABEL = 'Non';

    readonly columns = input.required<KzTableColumn[]>();
    readonly rows = input<KzTableRow[]>([]);
    readonly actions = input<KzTableAction[]>([]);
    readonly loading = input<boolean>(false);
    readonly emptyLabel = input<string>(KZ_LABELS.emptyList);
    readonly actionDone = output<KzTableActionEvent>();

    private readonly moneyPipe = inject(KzMoneyPipe);
    private readonly datePipe = inject(KzDatePipe);


    get hasActions(): boolean {
        return this.actions().length > 0;
    }


    isNumericColumn(column: KzTableColumn): boolean {
        return this.RIGHT_ALIGNED_FORMATS.includes(column.format);
    }


    cellText(row: KzTableRow, column: KzTableColumn): string {
        const value = row.cells[column.key];

        if (column.format === KzCellFormat.BOOLEAN) {
            return value === true ? this.YES_LABEL : this.NO_LABEL;
        }

        if (value === null || value === undefined) {
            return '';
        }

        return String(value);
    }


    cellMoney(row: KzTableRow, column: KzTableColumn): string {
        const value = row.cells[column.key];

        return this.moneyPipe.transform(typeof value === 'number' ? value : 0);
    }


    cellDate(row: KzTableRow, column: KzTableColumn): string {
        const value = row.cells[column.key];

        return this.datePipe.transform(value === null || value === undefined ? '' : String(value));
    }


    actionIconRef(action: KzTableAction): KzIconRef {
        return {
            name: this.actionIcon(action),
            size: this.ACTION_ICON_SIZE,
            tone: this.ACTION_ICON_TONE,
        };
    }


    actionLabel(action: KzTableAction): string {
        switch (action) {
            case KzTableAction.EDIT:
                return KZ_LABELS.edit;
            case KzTableAction.REMOVE:
                return KZ_LABELS.remove;
            case KzTableAction.CANCEL:
                return KZ_LABELS.cancel;
            default:
                return KZ_LABELS.refund;
        }
    }


    actionKind(action: KzTableAction): KzBtnKind {
        return this.DANGER_ACTIONS.includes(action) ? KzBtnKind.SECONDARY : this.GHOST_KIND;
    }


    onAction(action: KzTableAction, rowId: number): void {
        this.actionDone.emit({ action, rowId });
    }


    private actionIcon(action: KzTableAction): KzIconName {
        switch (action) {
            case KzTableAction.EDIT:
                return KzIconName.EDIT;
            case KzTableAction.REMOVE:
                return KzIconName.TRASH;
            case KzTableAction.CANCEL:
                return KzIconName.CLOSE;
            default:
                return KzIconName.CARD;
        }
    }
}
