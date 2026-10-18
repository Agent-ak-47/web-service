export interface KzExcursionForm {
    title: string;
    location: string;
    description: string;
    date: string;
    startTime: string;
    dureeMinutes: string;
    capacity: string;
    availableSeats: string;
    price: string;
    imageUrl: string;
    guide: string;
    active: boolean;
}


export const DEFAULT_KZ_EXCURSION_FORM: KzExcursionForm = {
    title: '',
    location: '',
    description: '',
    date: '',
    startTime: '',
    dureeMinutes: '',
    capacity: '',
    availableSeats: '',
    price: '',
    imageUrl: '',
    guide: '',
    active: true,
};


export interface KzExcursionFormErrors {
    title: string;
    location: string;
    dureeMinutes: string;
    capacity: string;
    availableSeats: string;
    price: string;
}


export const DEFAULT_KZ_EXCURSION_FORM_ERRORS: KzExcursionFormErrors = {
    title: '',
    location: '',
    dureeMinutes: '',
    capacity: '',
    availableSeats: '',
    price: '',
};