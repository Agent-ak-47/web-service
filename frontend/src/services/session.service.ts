import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { parseResponse } from '../models/kz_response';
import { AuthService } from './auth.service';
import { GlobalService } from './global.service';


@Injectable({ providedIn: 'root' })
export class SessionService {
    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);


    async logout(): Promise<void> {
        try {
            const response = await fetch(this.globalService.routes.logout, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);
            console.log(parseResponse<null>(raw, response.status));
        }
        catch (error: unknown) {
            console.error(error);
        }
        finally {
            this.authService.clearSession();
            this.router.navigateByUrl(this.globalService.pages.signIn);
        }
    }
}