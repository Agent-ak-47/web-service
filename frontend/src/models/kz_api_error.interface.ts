export interface KzApiError {
    code: string;
    message: string;
    details: Record<string, string | number | boolean | null>;
}


export const DEFAULT_KZ_API_ERROR: KzApiError = {
    code: 'INTERNAL_ERROR',
    message: 'Une erreur inattendue est survenue.',
    details: {},
};
