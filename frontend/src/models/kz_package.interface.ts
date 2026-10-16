import { KzPackageComposition } from './kz_package_composition.interface';


export interface KzPackage {
    id: number;
    name: string;
    description: string;
    destination: string;
    durationNights: number;
    price: number;
    startDate: string;
    endDate: string;
    discountPercentage: number;
    promoPrice: number;
    imageUrl: string;
    available: boolean;
    composition: KzPackageComposition;
}


export const DEFAULT_KZ_PACKAGE: KzPackage = {
    id: 0,
    name: '',
    description: '',
    destination: '',
    durationNights: 0,
    price: 0,
    startDate: '',
    endDate: '',
    discountPercentage: 0,
    promoPrice: 0,
    imageUrl: '',
    available: true,
    composition: {
        flights: [],
        excursions: [],
    },
};
