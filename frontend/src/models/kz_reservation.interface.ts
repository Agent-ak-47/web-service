import { KzReservationStatus } from './kz_reservation_status.enum';


export interface KzReservation {
    id: number;
    reference: string;
    userId: number;
    typeItem: string;
    itemId: number;
    itemLabel: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    status: KzReservationStatus;
    reservationDate: string;
    departureDate: string;
    cancellationReason: string;
}


export const DEFAULT_KZ_RESERVATION: KzReservation = {
    id: 0,
    reference: '',
    userId: 0,
    typeItem: '',
    itemId: 0,
    itemLabel: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    status: KzReservationStatus.PENDING,
    reservationDate: '',
    departureDate: '',
    cancellationReason: '',
};
