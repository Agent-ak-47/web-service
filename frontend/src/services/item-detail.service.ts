import { Injectable, inject } from '@angular/core';

import { KzItemType } from '../models/kz_item_type.enum';
import { KZ_LABELS } from '../models/kz_labels.interface';
import { KzReservation } from '../models/kz_reservation.interface';
import { parseItem, parseResponse } from '../models/kz_response';
import { AuthService } from './auth.service';
import { GlobalService } from './global.service';


export interface KzItemDetailLoad<T> {
    item: T | null;
    error: string;
    signedOut: boolean;
}


export interface KzItemReserveResult {
    path: string;
    error: string;
    signedOut: boolean;
}


@Injectable({ providedIn: 'root' })
export class ItemDetailService {
    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);


    async load<T>(url: string): Promise<KzItemDetailLoad<T>> {
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<unknown>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();

                return { item: null, error: '', signedOut: true };
            }

            if (parsed.error !== null) {
                return { item: null, error: parsed.error.message, signedOut: false };
            }

            return { item: parseItem<T>(parsed.data), error: '', signedOut: false };
        }
        catch (error: unknown) {
            console.error(error);

            return { item: null, error: KZ_LABELS.unexpectedError, signedOut: false };
        }
    }


    async reserve(typeItem: KzItemType, itemId: number, quantity: number): Promise<KzItemReserveResult> {
        if (!this.authService.isSignedIn) {
            return { path: this.globalService.pages.signIn, error: '', signedOut: false };
        }

        try {
            const response = await fetch(this.globalService.routes.reservations, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify({ typeItem, itemId, quantity }),
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzReservation>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();

                return { path: parsed.redirect, error: '', signedOut: true };
            }

            if (parsed.error !== null || parsed.data === null) {
                return { path: '', error: parsed.error?.message ?? KZ_LABELS.unexpectedError, signedOut: false };
            }

            this.authService.savePendingReservation(parsed.data);

            return { path: this.globalService.pages.payment, error: '', signedOut: false };
        }
        catch (error: unknown) {
            console.error(error);

            return { path: '', error: KZ_LABELS.unexpectedError, signedOut: false };
        }
    }
}