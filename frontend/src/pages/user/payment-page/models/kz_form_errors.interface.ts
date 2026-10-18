export interface KzFormErrors {
    cardHolder: string;
    cardNumber: string;
    expiration: string;
    cvv: string;
}


export const DEFAULT_KZ_FORM_ERRORS: KzFormErrors = {
    cardHolder: '',
    cardNumber: '',
    expiration: '',
    cvv: '',
};