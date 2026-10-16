import { KzExcursion } from './kz_excursion.interface';
import { KzFlight } from './kz_flight.interface';
import { KzPackage } from './kz_package.interface';
import { KzReservation } from './kz_reservation.interface';


export interface KzMockDataset {
    flights: KzFlight[];
    packages: KzPackage[];
    excursions: KzExcursion[];
    reservations: KzReservation[];
}


export const DEFAULT_KZ_MOCK_DATASET: KzMockDataset = {
    flights: [],
    packages: [],
    excursions: [],
    reservations: [],
};
