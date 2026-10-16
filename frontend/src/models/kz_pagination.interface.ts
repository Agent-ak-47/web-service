export interface KzPagination {
    page: number;
    size: number;
    total: number;
    totalPages: number;
}


export const DEFAULT_KZ_PAGINATION: KzPagination = {
    page: 1,
    size: 20,
    total: 0,
    totalPages: 0,
};
