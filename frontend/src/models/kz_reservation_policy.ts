import type { KzReservation } from './kz_reservation.interface';


export const CANCELLATION_NOTICE_DAYS = 2;
export const CANCELABLE_RESERVATION_STATUSES: readonly string[] = [
    'PENDING',
    'CONFIRMED',
    'PAID',
];

const DAY_MS = 86400000;


export function canCancelReservation(
    reservation: KzReservation,
    isAdmin: boolean,
    now: Date = new Date(),
): boolean {
    if (!CANCELABLE_RESERVATION_STATUSES.includes(reservation.status)) {
        return false;
    }

    if (isAdmin || !reservation.departureDate) {
        return true;
    }

    return daysUntil(reservation.departureDate, now) >= CANCELLATION_NOTICE_DAYS;
}


export function hasStartDatePassed(startDate: string | null | undefined, now: Date = new Date()): boolean {
    return daysUntil(startDate, now) < 0;
}


function daysUntil(departureDate: string | null | undefined, now: Date): number {
    if (!departureDate) {
        return Number.POSITIVE_INFINITY;
    }

    const parts = departureDate.slice(0, 10).split('-').map(Number);

    if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
        return Number.POSITIVE_INFINITY;
    }

    const departure = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    return Math.round((departure - today) / DAY_MS);
}
