export interface KzExcursionFilter {
    location: string;
    date: string;
    maxPrice: string;
}


export const DEFAULT_KZ_EXCURSION_FILTER: KzExcursionFilter = {
    location: '',
    date: '',
    maxPrice: '',
};
