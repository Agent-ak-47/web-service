export interface KzPackageFilter {
    destination: string;
    startDate: string;
    maxPrice: string;
}


export const DEFAULT_KZ_PACKAGE_FILTER: KzPackageFilter = {
    destination: '',
    startDate: '',
    maxPrice: '',
};
