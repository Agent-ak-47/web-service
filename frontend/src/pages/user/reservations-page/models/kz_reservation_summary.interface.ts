export interface KzReservationSummary {
    total: number;
    payable: number;
    cancelled: number;
}


export const DEFAULT_KZ_RESERVATION_SUMMARY: KzReservationSummary = {
    total: 0,
    payable: 0,
    cancelled: 0,
};
