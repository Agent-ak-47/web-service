import { Injectable } from '@angular/core';

import { KzIconImage } from '../models/kz_icon_image.interface';
import { KzIconName } from '../models/kz_icon_name.enum';


@Injectable({ providedIn: 'root' })
export class GlobalService {

    readonly APP_NAME = 'Atlas Voyages';
    readonly TAGLINE = 'Forfaits, vols et excursions reserves en quelques minutes.';
    readonly ICON_FOLDER = 'assets/icons/';
    readonly IMGS_FOLDER = 'imgs/';
    readonly DATA_URL_PREFIX = 'data:';
    readonly MOCK_DATA_FOLDER = 'data/';
    readonly MOCK_MODE = true;
    readonly BACKEND_URL = 'http://localhost:8083';
    readonly FLIGHT_SERVICE_URL = 'http://localhost:8081';
    readonly PACKAGE_SERVICE_URL = 'http://localhost:8082';
    readonly EXCURSION_SERVICE_URL = 'http://localhost:8084';
    readonly currency = 'MAD';
    readonly supportEmail = 'contact@atlas-voyages.travel';
    readonly supportPhone = '+212 5 22 00 00 00';

    readonly pages = {
        home: '/',
        packages: '/forfaits',
        packageDetail: (id: number): string => `/forfaits/${id}`,
        flights: '/vols',
        flightDetail: (id: number): string => `/vols/${id}`,
        excursions: '/excursions',
        excursionDetail: (id: number): string => `/excursions/${id}`,
        reservations: '/profil/reservations',
        payment: '/paiement',
        signIn: '/connexion',
        signUp: '/inscription',
        profile: '/profil',
        adminDashboard: '/admin',
        adminFlights: '/admin/vols',
        adminFlightForm: '/admin/vol-formulaire',
        adminFlightFormEdit: (id: number): string => `/admin/vol-formulaire/${id}`,
        adminPackages: '/admin/forfaits',
        adminPackageForm: '/admin/forfait-formulaire',
        adminPackageFormEdit: (id: number): string => `/admin/forfait-formulaire/${id}`,
        adminExcursions: '/admin/excursions',
        adminExcursionForm: '/admin/excursion-formulaire',
        adminExcursionFormEdit: (id: number): string => `/admin/excursion-formulaire/${id}`,
        adminReservations: '/admin/reservations',
    };

    readonly routes = {
        login: `${this.BACKEND_URL}/api/auth/login`,
        register: `${this.BACKEND_URL}/api/auth/register`,
        logout: `${this.BACKEND_URL}/api/auth/logout`,
        me: `${this.BACKEND_URL}/api/auth/me`,
        reservations: `${this.BACKEND_URL}/api/reservations`,
        reservationCancel: (id: number): string => `${this.BACKEND_URL}/api/reservations/${id}/cancellation`,
        reservationValidate: (id: number): string => `${this.BACKEND_URL}/api/reservations/${id}/validation`,
        reservationPayment: (id: number): string => `${this.BACKEND_URL}/api/reservations/${id}/payment`,
        reservationHistory: (id: number): string => `${this.BACKEND_URL}/api/reservations/${id}/history`,
        paymentRefund: (id: number): string => `${this.BACKEND_URL}/api/payments/${id}/refund`,
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
        ];
    }
}
