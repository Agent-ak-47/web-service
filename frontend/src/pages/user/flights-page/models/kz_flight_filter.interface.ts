export interface KzFlightFilter {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    maxPrice: string;
    quantity: string;
}


export const DEFAULT_KZ_FLIGHT_FILTER: KzFlightFilter = {
    departureCity: '',
    arrivalCity: '',
    departureDate: '',
    maxPrice: '',
    quantity: '1',
};


export const DEFAULT_KZ_FLIGHT_QUANTITY = 1;
