export interface KzFlight {
    id: number;
    airline: string;
    flightNumber: string;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    arrivalTime: string;
    totalSeats: number;
    availableSeats: number;
    price: number;
    active: boolean;
}


export const DEFAULT_KZ_FLIGHT: KzFlight = {
    id: 0,
    airline: '',
    flightNumber: '',
    departureCity: '',
    arrivalCity: '',
    departureTime: '',
    arrivalTime: '',
    totalSeats: 0,
    availableSeats: 0,
    price: 0,
    active: true,
};
