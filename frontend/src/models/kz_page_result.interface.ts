import { KzPagination } from './kz_pagination.interface';


export interface KzPageResult<T> {
    data: T[];
    pagination: KzPagination;
}


export function buildPageResult<T>(items: readonly T[]): KzPageResult<T> {
    return {
        data: [...items],
        pagination: {
            page: 1,
            size: items.length,
            total: items.length,
            totalPages: items.length > 0 ? 1 : 0,
        },
    };
}
