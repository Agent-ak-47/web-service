import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { GlobalService } from './global.service';
import { NavigationService } from './navigation.service';


@Injectable({ providedIn: 'root' })
export class UnauthorizedRedirectService {
    readonly UNAUTHORIZED = 401;
    readonly AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register'];

    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly globalService = inject(GlobalService);
    private readonly navigationService = inject(NavigationService);
    private installed = false;


    install(): void {
        if (this.installed) {
            return;
        }

        this.installed = true;
        const originalFetch = window.fetch.bind(window);

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const response = await originalFetch(input, init);

            if (response.status === this.UNAUTHORIZED && this.isCatalogRequest(input)) {
                this.authService.clearSession();

                if (this.router.url !== this.globalService.pages.signIn) {
                    this.navigationService.forceNextNavigation();
                    await this.router.navigateByUrl(this.globalService.pages.signIn);
                }
            }

            return response;
        };
    }


    private isCatalogRequest(input: RequestInfo | URL): boolean {
        const url = typeof input === 'string'
            ? input
            : input instanceof Request
                ? input.url
                : input.toString();

        return this.AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint)) === false;
    }
}
