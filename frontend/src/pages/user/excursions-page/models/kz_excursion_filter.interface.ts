export interface KzExcursionFilter {
    location: string;
    date: string;
    maxPrice: string;
    quantity: string;
}


export const DEFAULT_KZ_EXCURSION_FILTER: KzExcursionFilter = {
    location: '',
    date: '',
    maxPrice: '',
    quantity: '1',
};


export const DEFAULT_KZ_EXCURSION_QUANTITY = 1;
