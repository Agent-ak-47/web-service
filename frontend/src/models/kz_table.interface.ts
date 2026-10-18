export enum KzCellFormat {
    TEXT = 'text',
    PRICE = 'price',
    NUMBER = 'number',
    DATE = 'date',
    STATUS = 'status',
    BOOLEAN = 'boolean',
}


export interface KzTableColumn {
    key: string;
    label: string;
    format: KzCellFormat;
}


export interface KzTableRow {
    id: number;
    cells: Record<string, string | number | boolean | null>;
}


export enum KzTableAction {
    EDIT = 'edit',
    REMOVE = 'remove',
    CANCEL = 'cancel',
    REFUND = 'refund',
}


export interface KzTableActionEvent {
    action: KzTableAction;
    rowId: number;
}


export const DEFAULT_KZ_TABLE_COLUMN: KzTableColumn = {
    key: '',
    label: '',
    format: KzCellFormat.TEXT,
};


export const DEFAULT_KZ_TABLE_ROW: KzTableRow = {
    id: 0,
    cells: {},
};


export const DEFAULT_KZ_TABLE_ACTION_EVENT: KzTableActionEvent = {
    action: KzTableAction.EDIT,
    rowId: 0,
};
