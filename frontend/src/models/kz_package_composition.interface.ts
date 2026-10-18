import { KzExcursion } from './kz_excursion.interface';
import { KzFlight } from './kz_flight.interface';


export interface KzPackageComposition {
    flights: KzFlight[];
    excursions: KzExcursion[];
}


export const DEFAULT_KZ_PACKAGE_COMPOSITION: KzPackageComposition = {
    flights: [],
    excursions: [],
};
