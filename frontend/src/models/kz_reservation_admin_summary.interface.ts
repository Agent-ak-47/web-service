export interface KzReservationAdminSummary {
    total: number;
    pending: number;
    paid: number;
    cancelled: number;
    revenue: number;
}


export const DEFAULT_KZ_RESERVATION_ADMIN_SUMMARY: KzReservationAdminSummary = {
    total: 0,
    pending: 0,
    paid: 0,
    cancelled: 0,
    revenue: 0,
};