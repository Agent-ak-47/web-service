import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { GlobalService } from './global.service';


export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const globalService = inject(GlobalService);
    const router = inject(Router);

    if (authService.isSignedIn) {
        return true;
    }

    return router.navigateByUrl(globalService.pages.signIn);
};


export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const globalService = inject(GlobalService);
    const router = inject(Router);

    if (authService.isSignedIn && authService.isAdmin) {
        return true;
    }

    authService.clearSession();

    return router.navigateByUrl(globalService.pages.signIn);
};
