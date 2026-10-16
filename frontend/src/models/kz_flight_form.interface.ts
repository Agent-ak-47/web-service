export interface KzFlightForm {
    airline: string;
    flightNumber: string;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    arrivalTime: string;
    totalSeats: string;
    availableSeats: string;
    price: string;
    active: boolean;
}


export const DEFAULT_KZ_FLIGHT_FORM: KzFlightForm = {
    airline: '',
    flightNumber: '',
    departureCity: '',
    arrivalCity: '',
    departureTime: '',
    arrivalTime: '',
    totalSeats: '',
    availableSeats: '',
    price: '',
    active: true,
};


export interface KzFlightFormErrors {
    airline: string;
    flightNumber: string;
    departureCity: string;
    arrivalCity: string;
    totalSeats: string;
    availableSeats: string;
    price: string;
}


export const DEFAULT_KZ_FLIGHT_FORM_ERRORS: KzFlightFormErrors = {
    airline: '',
    flightNumber: '',
    departureCity: '',
    arrivalCity: '',
    totalSeats: '',
    availableSeats: '',
    price: '',
};