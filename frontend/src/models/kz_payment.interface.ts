import { KzPaymentMethod } from './kz_payment_method.enum';
import { KzPaymentStatus } from './kz_payment_status.enum';


export interface KzPayment {
    id: number;
    reservationId: number;
    amount: number;
    method: KzPaymentMethod;
    status: KzPaymentStatus;
    paymentDate: string;
    transactionRef: string;
    cardMask: string;
    errorCode: string;
}


export const DEFAULT_KZ_PAYMENT: KzPayment = {
    id: 0,
    reservationId: 0,
    amount: 0,
    method: KzPaymentMethod.CARD,
    status: KzPaymentStatus.PENDING,
    paymentDate: '',
    transactionRef: '',
    cardMask: '',
    errorCode: '',
};
