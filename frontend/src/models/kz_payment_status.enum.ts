export enum KzPaymentStatus {
    PENDING = 'PENDING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
}


export const DEFAULT_KZ_PAYMENT_STATUS = KzPaymentStatus.PENDING;
