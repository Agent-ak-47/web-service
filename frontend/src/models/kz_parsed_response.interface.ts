import { KzApiError } from './kz_api_error.interface';


export interface KzParsedResponse<T> {
    ok: boolean;
    data: T | null;
    error: KzApiError | null;
    redirect: string;
    status: number;
}
