export interface KzPackageFilter {
    destination: string;
    startDate: string;
    maxPrice: string;
    quantity: string;
}


export const DEFAULT_KZ_PACKAGE_FILTER: KzPackageFilter = {
    destination: '',
    startDate: '',
    maxPrice: '',
    quantity: '1',
};


export const DEFAULT_KZ_PACKAGE_QUANTITY = 1;
