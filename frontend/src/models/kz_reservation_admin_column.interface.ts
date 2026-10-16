import { KzCellFormat, KzTableColumn } from './kz_table.interface';


export interface KzReservationAdminColumn extends KzTableColumn { }


export const DEFAULT_KZ_RESERVATION_ADMIN_COLUMN: KzReservationAdminColumn = {
    key: '',
    label: '',
    format: KzCellFormat.TEXT,
};