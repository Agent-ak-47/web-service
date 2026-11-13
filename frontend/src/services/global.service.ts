import { Injectable } from '@angular/core';

import { KzIconImage } from '../models/kz_icon_image.interface';
import { KzIconName } from '../models/kz_icon_name.enum';


@Injectable({ providedIn: 'root' })
export class GlobalService {

    readonly APP_NAME = 'Atlas Trips';
    readonly TAGLINE = 'Packages, flights and excursions booked in a few minutes.';
    readonly ICON_FOLDER = 'assets/icons/';
    readonly IMGS_FOLDER = 'imgs/';
    readonly DATA_URL_PREFIX = 'data:';
    readonly MOCK_DATA_FOLDER = 'data/';
    readonly MOCK_MODE = true;
    readonly BACKEND_URL = 'http://localhost:8083';
    readonly RESERVATION_SERVICE_URL = 'http://localhost:8085';
    readonly PAYMENT_SERVICE_URL = 'http://localhost:8086';
    readonly FLIGHT_SERVICE_URL = 'http://localhost:8081';
    readonly PACKAGE_SERVICE_URL = 'http://localhost:8082';
    readonly EXCURSION_SERVICE_URL = 'http://localhost:8084';
    readonly currency = 'MAD';
    readonly supportEmail = 'contact@atlas-trips.travel';
    readonly supportPhone = '+212 5 22 00 00 00';

    readonly pages = {
        home: '/',
        packages: '/packages',
        packageDetail: (id: number): string => `/packages/${id}`,
        flights: '/flights',
        flightDetail: (id: number): string => `/flights/${id}`,
        excursions: '/excursions',
        excursionDetail: (id: number): string => `/excursions/${id}`,
        reservations: '/profile/reservations',
        payment: '/payment',
        signIn: '/sign-in',
        signUp: '/sign-up',
        profile: '/profile',
        adminDashboard: '/admin',
        adminFlights: '/admin/flights',
        adminFlightsSearch: '/admin/flights/search',
        adminFlightForm: '/admin/flights/form',
        adminFlightFormEdit: (id: number): string => `/admin/flights/form/${id}`,
        adminPackages: '/admin/packages',
        adminPackagesSearch: '/admin/packages/search',
        adminPackageForm: '/admin/packages/form',
        adminPackageFormEdit: (id: number): string => `/admin/packages/form/${id}`,
        adminExcursions: '/admin/excursions',
        adminExcursionsSearch: '/admin/excursions/search',
        adminExcursionForm: '/admin/excursions/form',
        adminExcursionFormEdit: (id: number): string => `/admin/excursions/form/${id}`,
        adminReservations: '/admin/reservations',
    };

    readonly routes = {
        login: `${this.BACKEND_URL}/api/auth/login`,
        register: `${this.BACKEND_URL}/api/auth/register`,
        logout: `${this.BACKEND_URL}/api/auth/logout`,
        me: `${this.BACKEND_URL}/api/auth/me`,
        reservations: `${this.RESERVATION_SERVICE_URL}/api/reservations`,
        reservationCancel: (id: number): string => `${this.RESERVATION_SERVICE_URL}/api/reservations/${id}/cancellation`,
        reservationValidate: (id: number): string => `${this.RESERVATION_SERVICE_URL}/api/reservations/${id}/validation`,
        reservationPayment: (id: number): string => `${this.PAYMENT_SERVICE_URL}/api/reservations/${id}/payment`,
        reservationHistory: (id: number): string => `${this.RESERVATION_SERVICE_URL}/api/reservations/${id}/history`,
        paymentRefund: (id: number): string => `${this.PAYMENT_SERVICE_URL}/api/reservations/${id}/refund`,
        flights: `${this.FLIGHT_SERVICE_URL}/api/flights`,
        flight: (id: number): string => `${this.FLIGHT_SERVICE_URL}/api/flights/${id}`,
        flightAvailability: (id: number): string => `${this.FLIGHT_SERVICE_URL}/api/flights/${id}/availability`,
        packages: `${this.PACKAGE_SERVICE_URL}/api/packages`,
        package: (id: number): string => `${this.PACKAGE_SERVICE_URL}/api/packages/${id}`,
        packageAvailability: (id: number): string => `${this.PACKAGE_SERVICE_URL}/api/packages/${id}/availability`,
        excursions: `${this.EXCURSION_SERVICE_URL}/api/excursions`,
        excursion: (id: number): string => `${this.EXCURSION_SERVICE_URL}/api/excursions/${id}`,
        excursionAvailability: (id: number): string => `${this.EXCURSION_SERVICE_URL}/api/excursions/${id}/availability`,
    };


    assetUrl(path: string): string {
        if (path.startsWith('http') || path.startsWith(this.DATA_URL_PREFIX) || path.startsWith('assets') || path.startsWith(this.IMGS_FOLDER)) {
            return path;
        }

        return `${this.BACKEND_URL}/${path}`;
    }


    iconSrc(name: KzIconName): string {
        return `${this.ICON_FOLDER}${name}.svg`;
    }


    iconImage(name: KzIconName, alt = ''): KzIconImage {
        return {
            src: this.iconSrc(name),
            alt,
        };
    }


    endpointUrls(): string[] {
        return [
            this.FLIGHT_SERVICE_URL,
            this.PACKAGE_SERVICE_URL,
            this.EXCURSION_SERVICE_URL,
            this.BACKEND_URL,
            this.RESERVATION_SERVICE_URL,
            this.PAYMENT_SERVICE_URL,
        ];
    }
}
