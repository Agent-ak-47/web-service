import { KzApiError } from './kz_api_error.interface';


export interface KzApiErrorEnvelope {
    error: KzApiError;
}


export const DEFAULT_KZ_API_ERROR_ENVELOPE: KzApiErrorEnvelope = {
    error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        details: {},
    },
};
