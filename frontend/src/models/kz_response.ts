import { DEFAULT_KZ_API_ERROR, KzApiError } from './kz_api_error.interface';
import { KzParsedResponse } from './kz_parsed_response.interface';
import { KzPageResult } from './kz_page_result.interface';


function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}


export function parseResponse<T>(raw: unknown, status: number): KzParsedResponse<T> {
    if (isRecord(raw)) {
        if ('data' in raw) {
            return {
                ok: true,
                data: raw['data'] as T,
                error: null,
                redirect: '',
                status,
            };
        }

        if ('error' in raw) {
            return {
                ok: false,
                data: null,
                error: parseError(raw['error']),
                redirect: '',
                status,
            };
        }

        if ('redirect' in raw) {
            return {
                ok: true,
                data: null,
                error: null,
                redirect: String(raw['redirect']),
                status,
            };
        }
    }

    return {
        ok: false,
        data: null,
        error: { ...DEFAULT_KZ_API_ERROR },
        redirect: '',
        status,
    };
}


export function parseError(raw: unknown): KzApiError {
    if (isRecord(raw)) {
        const details = isRecord(raw['details']) ? raw['details'] : {};

        return {
            code: String(raw['code'] ?? DEFAULT_KZ_API_ERROR.code),
            message: String(raw['message'] ?? DEFAULT_KZ_API_ERROR.message),
            details: details as Record<string, string | number | boolean | null>,
        };
    }

    return { ...DEFAULT_KZ_API_ERROR };
}


export function parseList<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) {
        return raw as T[];
    }

    if (isRecord(raw) && Array.isArray(raw['data'])) {
        return raw['data'] as T[];
    }

    if (isRecord(raw) && isRecord(raw['data']) && Array.isArray(raw['data']['data'])) {
        return raw['data']['data'] as T[];
    }

    return [];
}


export function parsePage<T>(raw: unknown): KzPageResult<T> {
    if (isRecord(raw) && isRecord(raw['data']) && Array.isArray(raw['data']['data'])) {
        const page = raw['data'];

        return {
            data: page['data'] as T[],
            pagination: {
                page: Number(page['page'] ?? 1),
                size: Number(page['size'] ?? 0),
                total: Number(page['total'] ?? 0),
                totalPages: Number(page['totalPages'] ?? 0),
            },
        };
    }

    const items = parseList<T>(raw);

    return {
        data: items,
        pagination: {
            page: 1,
            size: items.length,
            total: items.length,
            totalPages: items.length > 0 ? 1 : 0,
        },
    };
}


export function parseItem<T>(raw: unknown): T | null {
    if (isRecord(raw) && 'data' in raw && raw['data'] !== null) {
        return raw['data'] as T;
    }

    if (isRecord(raw)) {
        return raw as T;
    }

    return null;
}
