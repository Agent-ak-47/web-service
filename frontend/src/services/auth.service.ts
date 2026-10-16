import { Injectable } from '@angular/core';

import { KzAuthSession } from '../models/kz_auth_session.interface';
import { DEFAULT_KZ_RESERVATION, KzReservation } from '../models/kz_reservation.interface';
import { DEFAULT_KZ_USER, KzUser } from '../models/kz_user.interface';
import { KzUserRole } from '../models/kz_user_role.enum';


@Injectable({ providedIn: 'root' })
export class AuthService {
    readonly TOKEN_KEY = 'kz_token';
    readonly USER_KEY = 'kz_user';
    readonly PENDING_RESERVATION_KEY = 'kz_pending_reservation';
    readonly LAST_PAGE_KEY = 'kz_last_page';


    get token(): string {
        return sessionStorage.getItem(this.TOKEN_KEY) ?? '';
    }


    get user(): KzUser {
        const raw = sessionStorage.getItem(this.USER_KEY);

        if (raw === null) {
            return { ...DEFAULT_KZ_USER };
        }

        try {
            return JSON.parse(raw) as KzUser;
        }
        catch (error: unknown) {
            console.error(error);

            return { ...DEFAULT_KZ_USER };
        }
    }


    get isSignedIn(): boolean {
        return this.token.length > 0;
    }


    get isAdmin(): boolean {
        return this.user.role === KzUserRole.ADMIN;
    }


    get authHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.isSignedIn) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }


    get pendingReservation(): KzReservation {
        const raw = sessionStorage.getItem(this.PENDING_RESERVATION_KEY);

        if (raw === null) {
            return { ...DEFAULT_KZ_RESERVATION };
        }

        try {
            return JSON.parse(raw) as KzReservation;
        }
        catch (error: unknown) {
            console.error(error);

            return { ...DEFAULT_KZ_RESERVATION };
        }
    }


    saveSession(session: KzAuthSession): void {
        sessionStorage.setItem(this.TOKEN_KEY, session.jeton);
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(session.user));
    }


    savePendingReservation(reservation: KzReservation): void {
        sessionStorage.setItem(this.PENDING_RESERVATION_KEY, JSON.stringify(reservation));
    }


    rememberPage(page: string): void {
        sessionStorage.setItem(this.LAST_PAGE_KEY, page);
    }


    get lastPage(): string {
        return sessionStorage.getItem(this.LAST_PAGE_KEY) ?? '';
    }


    clearLastPage(): void {
        sessionStorage.removeItem(this.LAST_PAGE_KEY);
    }


    clearPendingReservation(): void {
        sessionStorage.removeItem(this.PENDING_RESERVATION_KEY);
    }


    clearSession(): void {
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.PENDING_RESERVATION_KEY);
    }}
