export interface KzCardForm {
    cardHolder: string;
    cardNumber: string;
    expiration: string;
    cvv: string;
}


export const DEFAULT_KZ_CARD_FORM: KzCardForm = {
    cardHolder: '',
    cardNumber: '',
    expiration: '',
    cvv: '',
};