import { Injectable, inject } from '@angular/core';

import { KzApiError } from '../models/kz_api_error.interface';
import { KzAuthSession } from '../models/kz_auth_session.interface';
import { KzExcursion } from '../models/kz_excursion.interface';
import { KzFlight } from '../models/kz_flight.interface';
import { KzItemType } from '../models/kz_item_type.enum';
import { KzMockDataset } from '../models/kz_mock_dataset.interface';
import { KzMockToken, KzMockUserAccount } from '../models/kz_mock_user_account.interface';
import { KzPackage } from '../models/kz_package.interface';
import { KzPayment } from '../models/kz_payment.interface';
import { KzPaymentMethod } from '../models/kz_payment_method.enum';
import { KzPaymentStatus } from '../models/kz_payment_status.enum';
import { KzReservation } from '../models/kz_reservation.interface';
import {
    CLIENT_CANCELLATION_NOTICE_DAYS,
    canCancelReservation,
    hasStartDatePassed,
} from '../models/kz_reservation_policy';
import { KzReservationStatus } from '../models/kz_reservation_status.enum';
import { KzUserRole } from '../models/kz_user_role.enum';
import { GlobalService } from './global.service';


interface KzMockBody {
    [key: string]: unknown;
}


interface KzMockIdentified {
    id: number;
}


@Injectable({ providedIn: 'root' })
export class MockBackendService {
	
    readonly DATASET_KEY = 'kz_mock_dataset';
    readonly VERSION_KEY = 'kz_mock_version';
    readonly USERS_KEY = 'kz_mock_users';
    readonly DATASET_VERSION = '3';
    readonly TOKEN_PREFIX = 'kzmock.';
    readonly TOKEN_LIFETIME_HOURS = 12;
    readonly DEMO_PASSWORD = 'Password123!';
    readonly DELAY_MS = 300;
    readonly DECLINED_CARD_SUFFIX = '0002';
    readonly REFERENCE_PREFIX = 'RES-2026-';
    readonly REFERENCE_PADDING = 6;
    readonly MIN_PASSWORD_LENGTH = 8;
    readonly PACKAGE_CAPACITY = 10;
    readonly JSON_HEADERS = { 'Content-Type': 'application/json' };
    readonly OK = 200;
    readonly CREATED = 201;
    readonly BAD_REQUEST = 400;
    readonly UNAUTHENTICATED = 401;
    readonly PAYMENT_DECLINED = 402;
    readonly FORBIDDEN = 403;
    readonly NOT_FOUND = 404;
    readonly CONFLICT = 409;
    readonly UNPROCESSABLE_ENTITY = 422;

    dataset: KzMockDataset = { flights: [], packages: [], excursions: [], reservations: [] };
    users: KzMockUserAccount[] = [];
    payments: KzPayment[] = [];

    private readonly globalService = inject(GlobalService);
    private isInstalled = false;


    async install(): Promise<void> {
        if (this.isInstalled) {
            return;
        }

        this.isInstalled = true;
        await this.loadAssets();
        this.patchFetch();
    }


    reset(): void {
        sessionStorage.removeItem(this.DATASET_KEY);
        sessionStorage.removeItem(this.USERS_KEY);
        sessionStorage.removeItem(this.VERSION_KEY);
        this.dataset = { flights: [], packages: [], excursions: [], reservations: [] };
        this.users = [];
        this.payments = [];
    }


    private async loadAssets(): Promise<void> {
        const [flights, packages, excursions, reservations, admin, client] = await Promise.all([
            this.readAsset<KzFlight[]>('flights.json'),
            this.readAsset<KzPackage[]>('packages.json'),
            this.readAsset<KzExcursion[]>('excursions.json'),
            this.readAsset<KzReservation[]>('reservations.json'),
            this.readAsset<KzMockUserAccount>('admin.json'),
            this.readAsset<KzMockUserAccount>('client.json'),
        ]);

        const demoAccounts: KzMockUserAccount[] = [
            { ...client, password: this.DEMO_PASSWORD },
            { ...admin, password: this.DEMO_PASSWORD },
        ];

        this.dataset = this.restoreDataset({ flights, packages, excursions, reservations });
        this.users = this.restoreUsers(demoAccounts);
    }


    private restoreDataset(fresh: KzMockDataset): KzMockDataset {
        const stored = sessionStorage.getItem(this.DATASET_KEY);
        const version = sessionStorage.getItem(this.VERSION_KEY);

        if (stored === null || version !== this.DATASET_VERSION) {
            this.reset();
            sessionStorage.setItem(this.VERSION_KEY, this.DATASET_VERSION);

            return fresh;
        }

        try {
            return JSON.parse(stored) as KzMockDataset;
        }
        catch (error: unknown) {
            console.error(error);
            this.reset();

            return fresh;
        }
    }


    private restoreUsers(demoAccounts: KzMockUserAccount[]): KzMockUserAccount[] {
        const stored = sessionStorage.getItem(this.USERS_KEY);

        if (stored === null) {
            return demoAccounts;
        }

        try {
            const created = JSON.parse(stored) as KzMockUserAccount[];

            return [...demoAccounts, ...created];
        }
        catch (error: unknown) {
            console.error(error);

            return demoAccounts;
        }
    }


    private async readAsset<T>(fileName: string): Promise<T> {
        const response = await fetch(`${this.globalService.MOCK_DATA_FOLDER}${fileName}`);
        const raw: unknown = await response.json();
        console.log(raw);

        return raw as T;
    }


    private patchFetch(): void {
        const service = this;

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            return service.handle(input, init);
        };
    }


    private async handle(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const url = typeof input === 'string' ? input : input.toString();
        const parsed = new URL(url, window.location.origin);
        const method = (init?.method ?? 'GET').toUpperCase();

        await this.delay();

        const parts = parsed.pathname.split('/').filter((part) => part.length > 0);

        return this.route(parts, method, this.readBody(init), this.readToken(init), parsed.searchParams);
    }


    private route(
        parts: readonly string[],
        method: string,
        body: KzMockBody,
        token: KzMockToken | null,
        query: URLSearchParams,
    ): Response {
        const resource = parts[1] ?? '';
        const id = Number(parts[2] ?? '0');
        const action = parts[3] ?? '';

        if (resource === 'auth') {
            return this.routeAuth(parts[2] ?? '', method, body, token);
        }

        if (resource === 'reservations') {
            return this.routeReservations(method, body, id, action, token, query);
        }

        if (resource === 'payments') {
            return this.routePayments(method, id, token);
        }

        if (resource === 'flights') {
            return this.routeCatalog(
                resource,
                () => this.dataset.flights,
                (items: KzFlight[]) => this.writeFlights(items),
                method, body, id, action, token, query);
        }

        if (resource === 'packages') {
            return this.routeCatalog(
                resource,
                () => this.dataset.packages,
                (items: KzPackage[]) => this.writePackages(items),
                method, body, id, action, token, query);
        }

        if (resource === 'excursions') {
            return this.routeCatalog(
                resource,
                () => this.dataset.excursions,
                (items: KzExcursion[]) => this.writeExcursions(items),
                method, body, id, action, token, query);
        }

        return this.fail(this.NOT_FOUND, 'NOT_FOUND', 'Unknown resource.');
    }


    private routeAuth(action: string, method: string, body: KzMockBody, token: KzMockToken | null): Response {
        if (action === 'me') {
            return this.profile(method, body, token);
        }

        if (method !== 'POST') {
            return this.fail(this.BAD_REQUEST, 'INVALID_FORMAT', 'Method not supported.');
        }

        if (action === 'login') {
            return this.login(String(body['email'] ?? ''), String(body['password'] ?? ''));
        }

        if (action === 'register') {
            return this.register(body);
        }

        if (action === 'logout') {
            return this.ok({ message: 'Session closed.' });
        }

        return this.fail(this.NOT_FOUND, 'NOT_FOUND', 'Unknown route.');
    }


    private profile(method: string, body: KzMockBody, token: KzMockToken | null): Response {
        if (token === null) {
            return this.fail(this.UNAUTHENTICATED, 'UNAUTHENTICATED', 'Authentication required.');
        }

        const account = this.users.find((user) => user.id === token.id);

        if (account === undefined) {
            return this.fail(this.NOT_FOUND, 'NOT_FOUND', 'User not found.');
        }

        if (method === 'GET') {
            return this.ok({ ...account });
        }

        account.name = String(body['name'] ?? account.name);
        account.phone = String(body['phone'] ?? account.phone);
        account.address = String(body['address'] ?? account.address);
        this.saveUsers();

        return this.ok(this.buildSession(account));
    }


    private login(email: string, password: string): Response {
        const account = this.users.find((user) => user.email === email);

        if (account === undefined || account.password !== password) {
            return this.fail(this.UNAUTHENTICATED, 'UNAUTHENTICATED', 'Wrong email or password.');
        }

        return this.ok(this.buildSession(account));
    }


    private register(body: KzMockBody): Response {
        const email = String(body['email'] ?? '');
        const password = String(body['password'] ?? '');
        const exists = this.users.some((user) => user.email === email);

        if (exists) {
            return this.fail(this.CONFLICT, 'DUPLICATE', 'This email is already used.');
        }

        if (password.length < this.MIN_PASSWORD_LENGTH) {
            return this.fail(this.BAD_REQUEST, 'BUSINESS_RULE_VIOLATION',
                `The password must contain at least ${this.MIN_PASSWORD_LENGTH} characters.`);
        }

        const account: KzMockUserAccount = {
            id: this.nextUserId(),
            name: '',
            email,
            role: KzUserRole.CLIENT,
            phone: '',
            address: '',
            password,
        };

        this.users = [...this.users, account];
        this.saveUsers();

        return this.ok(this.buildSession(account));
    }


    private routeReservations(
        method: string,
        body: KzMockBody,
        id: number,
        action: string,
        token: KzMockToken | null,
        query: URLSearchParams,
    ): Response {
        if (token === null) {
            return this.fail(this.UNAUTHENTICATED, 'UNAUTHENTICATED', 'Authentication required.');
        }

        if (method === 'GET' && action.length === 0) {
            return this.page(this.filterReservations(this.visibleReservations(token), query));
        }

        if (method === 'POST' && action.length === 0) {
            return this.createReservation(body, token.id);
        }

        const reservation = this.dataset.reservations.find((item) => item.id === id);

        if (reservation === undefined) {
            return this.fail(this.NOT_FOUND, 'ITEM_NOT_FOUND', 'Booking not found.');
        }

        if (method === 'POST' && action === 'cancellation') {
            return this.cancelReservation(
                reservation,
                String(body['reason'] ?? ''),
                token.role === KzUserRole.ADMIN,
            );
        }

        if (method === 'POST' && action === 'payment') {
            return this.payReservation(reservation, body);
        }

        if (method === 'POST' && action === 'validation') {
            reservation.status = KzReservationStatus.CONFIRMED;

            return this.ok(this.saveReservation(reservation));
        }

        if (method === 'GET' && action === 'history') {
            return this.ok({ reservationId: reservation.id, status: reservation.status });
        }

        return this.fail(this.NOT_FOUND, 'NOT_FOUND', 'Unknown route.');
    }


    private visibleReservations(token: KzMockToken): KzReservation[] {
        if (token.role === KzUserRole.ADMIN) {
            return [...this.dataset.reservations];
        }

        return this.dataset.reservations.filter((reservation) => reservation.userId === token.id);
    }


    private filterReservations(items: readonly KzReservation[], query: URLSearchParams): KzReservation[] {
        const search = this.clean(query.get('search')).toLowerCase();
        const status = this.clean(query.get('status')).toUpperCase();
        const typeItem = this.clean(query.get('typeItem')).toUpperCase();

        return items.filter((item) =>
            (search.length === 0
                || item.reference.toLowerCase().includes(search)
                || item.itemLabel.toLowerCase().includes(search))
            && (status.length === 0 || item.status === status)
            && (typeItem.length === 0 || item.typeItem === typeItem));
    }


    private createReservation(body: KzMockBody, userId: number): Response {
        const typeItem = String(body['typeItem'] ?? '');
        const itemId = Number(body['itemId'] ?? 0);
        const quantity = Number(body['quantity'] ?? 1);
        const item = this.findItem(typeItem, itemId);

        if (item === null) {
            return this.fail(this.NOT_FOUND, 'ITEM_NOT_FOUND', 'Item not found.');
        }

        const departureDate = this.departureDateOf(typeItem, itemId);

        if (hasStartDatePassed(departureDate)) {
            return this.fail(
                this.UNPROCESSABLE_ENTITY,
                'BUSINESS_RULE_VIOLATION',
                'This product can no longer be booked because its start date has passed.',
                { itemId, departureDate },
            );
        }

        const available = this.remainingOf(typeItem, itemId);

        if (quantity <= 0 || available < quantity) {
            return this.fail(this.CONFLICT, 'INSUFFICIENT_AVAILABILITY',
                `Only ${available} seat(s) left for this item.`,
                { itemId, requested: quantity, available });
        }

        const unitPrice = this.priceOf(typeItem, itemId);
        const reservation: KzReservation = {
            id: this.nextReservationId(),
            reference: this.buildReference(),
            userId,
            typeItem,
            itemId,
            itemLabel: this.labelOf(typeItem, itemId),
            quantity,
            unitPrice,
            totalAmount: Number((unitPrice * quantity).toFixed(2)),
            status: KzReservationStatus.PENDING,
            reservationDate: new Date().toISOString(),
            departureDate,
            cancellationReason: '',
        };

        this.dataset.reservations = [...this.dataset.reservations, reservation];
        this.decrease(typeItem, itemId, quantity);
        this.saveDataset();

        return this.ok(reservation, this.CREATED);
    }


    private cancelReservation(
        reservation: KzReservation,
        reason: string,
        isAdmin: boolean,
    ): Response {
        const locked: readonly KzReservationStatus[] = [
            KzReservationStatus.REFUNDED,
            KzReservationStatus.EXPIRED,
        ];

        if (locked.includes(reservation.status) || reservation.status === KzReservationStatus.CANCELLED) {
            return this.fail(this.CONFLICT, 'INVALID_STATUS', 'This booking can no longer be cancelled.');
        }

        if (!canCancelReservation(reservation, isAdmin)) {
            return this.fail(
                this.UNPROCESSABLE_ENTITY,
                'BUSINESS_RULE_VIOLATION',
                `A booking can only be cancelled ${CLIENT_CANCELLATION_NOTICE_DAYS} days `
                + 'before its start date.',
                { departureDate: reservation.departureDate, noticeDays: CLIENT_CANCELLATION_NOTICE_DAYS },
            );
        }

        const releasesStock = reservation.status === KzReservationStatus.PENDING
            || reservation.status === KzReservationStatus.CONFIRMED;

        reservation.status = KzReservationStatus.CANCELLED;
        reservation.cancellationReason = reason;

        if (releasesStock) {
            this.increase(reservation.typeItem, reservation.itemId, reservation.quantity);
        }

        return this.ok(this.saveReservation(reservation));
    }


    private payReservation(reservation: KzReservation, body: KzMockBody): Response {
        const cardNumber = String(body['cardNumber'] ?? '');

        if (reservation.status === KzReservationStatus.CANCELLED
            || reservation.status === KzReservationStatus.REFUNDED) {
            return this.fail(this.CONFLICT, 'INVALID_STATUS', 'Booking cancelled.');
        }

        if (cardNumber.endsWith(this.DECLINED_CARD_SUFFIX)) {
            return this.fail(this.PAYMENT_DECLINED, 'PAYMENT_DECLINED', 'Payment declined by the bank.');
        }

        reservation.status = KzReservationStatus.PAID;
        this.saveReservation(reservation);

        const payment: KzPayment = {
            id: this.payments.length + 1,
            reservationId: reservation.id,
            amount: reservation.totalAmount,
            method: KzPaymentMethod.CARD,
            status: KzPaymentStatus.SUCCEEDED,
            paymentDate: new Date().toISOString(),
            transactionRef: `TXN-${Date.now()}`,
            cardMask: cardNumber.slice(-4),
            errorCode: '',
        };

        this.payments = [...this.payments, payment];

        return this.ok({ reservation, payment });
    }


    private routePayments(method: string, id: number, token: KzMockToken | null): Response {
        const denied = this.requireAdmin(token);

        if (denied !== null) {
            return denied;
        }

        if (method !== 'POST') {
            return this.fail(this.BAD_REQUEST, 'INVALID_FORMAT', 'Method not supported.');
        }

        const payment = this.payments.find((item) => item.id === id);
        const reservation = this.dataset.reservations.find((item) => item.id === id);

        if (payment === undefined && reservation === undefined) {
            return this.fail(this.NOT_FOUND, 'ITEM_NOT_FOUND', 'Payment not found.');
        }

        if (payment !== undefined) {
            payment.status = KzPaymentStatus.REFUNDED;
        }

        if (reservation !== undefined) {
            reservation.status = KzReservationStatus.REFUNDED;
            this.saveReservation(reservation);
        }

        return this.ok({ refunded: true, reservationId: id });
    }


    private routeCatalog<T extends KzMockIdentified>(
        resource: string,
        read: () => T[],
        write: (items: T[]) => void,
        method: string,
        body: KzMockBody,
        id: number,
        action: string,
        token: KzMockToken | null,
        query: URLSearchParams,
    ): Response {
        if (method === 'GET') {
            return this.readCatalog(resource, read(), id, action, query);
        }

        const denied = this.requireAdmin(token);

        if (denied !== null) {
            return denied;
        }

        const items = read();
        const index = items.findIndex((entry) => entry.id === id);

        if (method === 'POST' && id === 0) {
            const created = { ...body, id: this.nextIdOf(items) } as unknown as T;
            write([...items, created]);

            return this.ok(created, this.CREATED);
        }

        if (method === 'POST') {
            if (index < 0) {
                return this.fail(this.NOT_FOUND, 'ITEM_NOT_FOUND', 'Item not found.');
            }

            const updated = { ...items[index], ...body, id } as T;
            const copy = [...items];
            copy[index] = updated;
            write(copy);

            return this.ok(updated);
        }

        if (method === 'DELETE') {
            write(items.filter((entry) => entry.id !== id));

            return this.ok({ deleted: true, id });
        }

        return this.fail(this.BAD_REQUEST, 'INVALID_FORMAT', 'Method not supported.');
    }


    private readCatalog<T extends KzMockIdentified>(
        resource: string,
        items: T[],
        id: number,
        action: string,
        query: URLSearchParams,
    ): Response {
        const index = items.findIndex((entry) => entry.id === id);

        if (id === 0) {
            return this.page(this.filterCatalog(resource, items, query));
        }

        if (action === 'availability') {
            return this.ok({ itemId: id, available: index >= 0 });
        }

        if (index < 0) {
            return this.fail(this.NOT_FOUND, 'ITEM_NOT_FOUND', 'Item not found.');
        }

        return this.ok(items[index]);
    }


    private filterCatalog<T extends KzMockIdentified>(
        resource: string,
        items: readonly T[],
        query: URLSearchParams,
    ): T[] {
        const search = this.clean(query.get('search')).toLowerCase();

        return items.filter((entry) => {
            const item = entry as unknown as Record<string, unknown>;

            if (search.length > 0 && !this.searchFields(resource).some((field) =>
                this.fieldOf(item, field).toLowerCase().includes(search))) {
                return false;
            }

            if (resource === 'flights') {
                for (const field of ['departureCity', 'arrivalCity', 'airline']) {
                    const wanted = this.clean(query.get(field)).toLowerCase();

                    if (wanted.length > 0 && !this.fieldOf(item, field).toLowerCase().includes(wanted)) {
                        return false;
                    }
                }

                for (const [queryField, itemField] of [
                    ['departureDate', 'departureTime'],
                    ['arrivalDate', 'arrivalTime'],
                ]) {
                    const wanted = this.clean(query.get(queryField));

                    if (wanted.length > 0 && !this.fieldOf(item, itemField).startsWith(wanted)) {
                        return false;
                    }
                }

                const seats = this.numberOf(item, 'availableSeats');
                const minSeats = this.numberParam(query, 'minSeats');

                if (seats !== null && minSeats !== null && seats < minSeats) {
                    return false;
                }
            }

            if (resource === 'packages') {
                const destination = this.clean(query.get('destination')).toLowerCase();

                if (destination.length > 0
                    && !this.fieldOf(item, 'destination').toLowerCase().includes(destination)) {
                    return false;
                }

                const startDate = this.clean(query.get('startDate'));

                if (startDate.length > 0 && !this.fieldOf(item, 'startDate').startsWith(startDate)) {
                    return false;
                }
            }

            if (resource === 'excursions') {
                const location = this.clean(query.get('location')).toLowerCase();

                if (location.length > 0 && !this.fieldOf(item, 'location').toLowerCase().includes(location)) {
                    return false;
                }

                const date = this.clean(query.get('date'));

                if (date.length > 0 && !this.fieldOf(item, 'date').startsWith(date)) {
                    return false;
                }

                const fromDate = this.clean(query.get('fromDate'));

                if (fromDate.length > 0 && this.fieldOf(item, 'date') < fromDate) {
                    return false;
                }

                const toDate = this.clean(query.get('toDate'));

                if (toDate.length > 0 && this.fieldOf(item, 'date') > toDate) {
                    return false;
                }

                const duration = this.numberOf(item, 'dureeMinutes');
                const maxDuration = this.numberParam(query, 'maxDuration');

                if (duration !== null && maxDuration !== null && duration > maxDuration) {
                    return false;
                }
            }

            const price = this.catalogPrice(item);
            const minPrice = this.numberParam(query, 'minPrice');
            const maxPrice = this.numberParam(query, 'maxPrice');

            if (price !== null && minPrice !== null && price < minPrice) {
                return false;
            }

            return price === null || maxPrice === null || price <= maxPrice;
        });
    }


    private searchFields(resource: string): string[] {
        if (resource === 'flights') {
            return ['airline', 'flightNumber', 'departureCity', 'arrivalCity'];
        }

        if (resource === 'packages') {
            return ['name', 'destination'];
        }

        if (resource === 'excursions') {
            return ['title', 'location', 'guide'];
        }

        return [];
    }


    private clean(value: string | null): string {
        return (value ?? '').trim();
    }


    private fieldOf(item: Record<string, unknown>, name: string): string {
        const value = item[name];

        return value === null || value === undefined ? '' : String(value);
    }


    private numberOf(item: Record<string, unknown>, name: string): number | null {
        const value = Number(item[name]);

        return Number.isFinite(value) ? value : null;
    }


    private numberParam(query: URLSearchParams, name: string): number | null {
        const raw = this.clean(query.get(name));

        if (raw.length === 0) {
            return null;
        }

        const value = Number(raw);

        return Number.isFinite(value) ? value : null;
    }


    private catalogPrice(item: Record<string, unknown>): number | null {
        const price = this.numberOf(item, 'price');
        const promo = this.numberOf(item, 'promoPrice');

        return promo !== null && promo > 0 ? promo : price;
    }


    private writeFlights(items: KzFlight[]): void {
        this.dataset.flights = items;
        this.saveDataset();
    }


    private writePackages(items: KzPackage[]): void {
        this.dataset.packages = items;
        this.saveDataset();
    }


    private writeExcursions(items: KzExcursion[]): void {
        this.dataset.excursions = items;
        this.saveDataset();
    }


    private findItem(typeItem: string, itemId: number): KzFlight | KzPackage | KzExcursion | null {
        if (typeItem === KzItemType.FLIGHT) {
            return this.dataset.flights.find((item) => item.id === itemId) ?? null;
        }

        if (typeItem === KzItemType.PACKAGE) {
            return this.dataset.packages.find((item) => item.id === itemId) ?? null;
        }

        if (typeItem === KzItemType.EXCURSION) {
            return this.dataset.excursions.find((item) => item.id === itemId) ?? null;
        }

        return null;
    }


    private remainingOf(typeItem: string, itemId: number): number {
        if (typeItem === KzItemType.FLIGHT) {
            return this.dataset.flights.find((item) => item.id === itemId)?.availableSeats ?? 0;
        }

        if (typeItem === KzItemType.EXCURSION) {
            return this.dataset.excursions.find((item) => item.id === itemId)?.availableSeats ?? 0;
        }

        const item = this.dataset.packages.find((entry) => entry.id === itemId);

        return item !== undefined && item.available ? this.PACKAGE_CAPACITY : 0;
    }


    private priceOf(typeItem: string, itemId: number): number {
        if (typeItem === KzItemType.FLIGHT) {
            return this.dataset.flights.find((item) => item.id === itemId)?.price ?? 0;
        }

        if (typeItem === KzItemType.EXCURSION) {
            return this.dataset.excursions.find((item) => item.id === itemId)?.price ?? 0;
        }

        const item = this.dataset.packages.find((entry) => entry.id === itemId);

        if (item === undefined) {
            return 0;
        }

        return item.promoPrice > 0 ? item.promoPrice : item.price;
    }


    private labelOf(typeItem: string, itemId: number): string {
        const item = this.findItem(typeItem, itemId);

        if (item === null) {
            return '';
        }

        if (typeItem === KzItemType.FLIGHT) {
            const flight = item as KzFlight;

            return `${flight.departureCity} - ${flight.arrivalCity} (${flight.flightNumber})`;
        }

        if (typeItem === KzItemType.EXCURSION) {
            return (item as KzExcursion).title;
        }

        return (item as KzPackage).name;
    }


    private departureDateOf(typeItem: string, itemId: number): string {
        const item = this.findItem(typeItem, itemId);

        if (item === null) {
            return '';
        }

        if (typeItem === KzItemType.FLIGHT) {
            return (item as KzFlight).departureTime.slice(0, 10);
        }

        if (typeItem === KzItemType.EXCURSION) {
            return (item as KzExcursion).date;
        }

        return (item as KzPackage).startDate;
    }


    private decrease(typeItem: string, itemId: number, quantity: number): void {
        if (typeItem === KzItemType.FLIGHT) {
            const flight = this.dataset.flights.find((item) => item.id === itemId);

            if (flight !== undefined) {
                flight.availableSeats = Math.max(0, flight.availableSeats - quantity);
                this.saveDataset();
            }

            return;
        }

        if (typeItem === KzItemType.EXCURSION) {
            const excursion = this.dataset.excursions.find((item) => item.id === itemId);

            if (excursion !== undefined) {
                excursion.availableSeats = Math.max(0, excursion.availableSeats - quantity);
                this.saveDataset();
            }
        }
    }


    private increase(typeItem: string, itemId: number, quantity: number): void {
        if (typeItem === KzItemType.FLIGHT) {
            const flight = this.dataset.flights.find((item) => item.id === itemId);

            if (flight !== undefined) {
                flight.availableSeats = flight.availableSeats + quantity;
                this.saveDataset();
            }

            return;
        }

        if (typeItem === KzItemType.EXCURSION) {
            const excursion = this.dataset.excursions.find((item) => item.id === itemId);

            if (excursion !== undefined) {
                excursion.availableSeats = excursion.availableSeats + quantity;
                this.saveDataset();
            }
        }
    }


    private saveReservation(reservation: KzReservation): KzReservation {
        this.dataset.reservations = this.dataset.reservations.map((item) =>
            item.id === reservation.id ? reservation : item);
        this.saveDataset();

        return reservation;
    }


    private saveDataset(): void {
        sessionStorage.setItem(this.DATASET_KEY, JSON.stringify(this.dataset));
    }


    private saveUsers(): void {
        const created = this.users.filter((user) =>
            user.email !== 'client@agency.travel' && user.email !== 'admin@agency.travel');

        sessionStorage.setItem(this.USERS_KEY, JSON.stringify(created));
    }


    private buildSession(account: KzMockUserAccount): KzAuthSession {
        const token: KzMockToken = {
            id: account.id,
            name: account.name,
            email: account.email,
            role: account.role,
        };

        const expiration = new Date(Date.now() + this.TOKEN_LIFETIME_HOURS * 3600000).toISOString();

        return {
            jeton: `${this.TOKEN_PREFIX}${btoa(JSON.stringify(token))}`,
            expiration,
            user: {
                id: account.id,
                name: account.name,
                email: account.email,
                role: account.role,
                phone: account.phone,
                address: account.address,
            },
        };
    }


    private readToken(init?: RequestInit): KzMockToken | null {
        const headers = new Headers(init?.headers);
        const authorization = headers.get('Authorization') ?? '';
        const value = authorization.replace('Bearer ', '');

        if (!value.startsWith(this.TOKEN_PREFIX)) {
            return null;
        }

        try {
            return JSON.parse(atob(value.replace(this.TOKEN_PREFIX, ''))) as KzMockToken;
        }
        catch (error: unknown) {
            console.error(error);

            return null;
        }
    }


    private readBody(init?: RequestInit): KzMockBody {
        if (typeof init?.body !== 'string') {
            return {};
        }

        try {
            const parsed: unknown = JSON.parse(init.body);

            return typeof parsed === 'object' && parsed !== null ? parsed as KzMockBody : {};
        }
        catch (error: unknown) {
            console.error(error);

            return {};
        }
    }


    private requireAdmin(token: KzMockToken | null): Response | null {
        if (token === null) {
            return this.fail(this.UNAUTHENTICATED, 'UNAUTHENTICATED', 'Authentication required.');
        }

        return token.role === KzUserRole.ADMIN
            ? null
            : this.fail(this.FORBIDDEN, 'FORBIDDEN', 'Admin access only.');
    }


    private nextUserId(): number {
        return this.users.reduce((highest: number, user: KzMockUserAccount) =>
            Math.max(highest, user.id), 0) + 1;
    }


    private nextReservationId(): number {
        return this.nextIdOf(this.dataset.reservations);
    }


    private nextIdOf<T extends KzMockIdentified>(items: readonly T[]): number {
        return items.reduce((highest: number, item: T) => Math.max(highest, item.id), 0) + 1;
    }


    private buildReference(): string {
        const sequence = String(this.nextReservationId()).padStart(this.REFERENCE_PADDING, '0');

        return `${this.REFERENCE_PREFIX}${sequence}`;
    }


    private page<T>(items: readonly T[]): Response {
        return this.ok({
            data: [...items],
            pagination: {
                page: 1,
                size: items.length,
                total: items.length,
                totalPages: items.length > 0 ? 1 : 0,
            },
        });
    }


    private ok(data: unknown, status = this.OK): Response {
        return this.json({ data }, status);
    }


    private fail(status: number, code: string, message: string, details: KzApiError['details'] = {}): Response {
        const error: KzApiError = { code, message, details };

        return this.json({ error }, status);
    }


    private json(body: unknown, status: number): Response {
        return new Response(JSON.stringify(body), {
            status,
            headers: this.JSON_HEADERS,
        });
    }


    private delay(): Promise<void> {
        return new Promise((resolve: () => void) => {
            setTimeout(resolve, this.DELAY_MS);
        });
    }
}
