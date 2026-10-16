export interface KzFlightFilter {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    maxPrice: string;
}


export const DEFAULT_KZ_FLIGHT_FILTER: KzFlightFilter = {
    departureCity: '',
    arrivalCity: '',
    departureDate: '',
    maxPrice: '',
};
