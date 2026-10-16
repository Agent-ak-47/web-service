export enum KzReservationStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
    EXPIRED = 'EXPIRED',
}


export const CANCELABLE_RESERVATION_STATUSES: readonly KzReservationStatus[] = [
    KzReservationStatus.PENDING,
    KzReservationStatus.CONFIRMED,
];


export const PAYABLE_RESERVATION_STATUSES: readonly KzReservationStatus[] = [
    KzReservationStatus.PENDING,
    KzReservationStatus.CONFIRMED,
];


export const DEFAULT_KZ_RESERVATION_STATUS = KzReservationStatus.PENDING;
