import { KzCellFormat } from '../../../../models/kz_table.interface';


export interface KzReservationColumn {
    key: string;
    label: string;
    format: KzCellFormat;
}


export const DEFAULT_KZ_RESERVATION_COLUMN: KzReservationColumn = {
    key: '',
    label: '',
    format: KzCellFormat.TEXT,
};
