import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { GlobalService } from './global.service';
import { NavigationService } from './navigation.service';
import { UnauthorizedRedirectService } from './unauthorized-redirect.service';


const auth = {
    clearSession: vi.fn(),
};

const router = {
    url: '/admin/flights/form',
    navigateByUrl: vi.fn(),
};

const global = {
    pages: { signIn: '/sign-in' },
};


function response(status: number): { status: number } {
    return { status };
}


describe('UnauthorizedRedirectService', () => {
    let service: UnauthorizedRedirectService;
    let navigationService: NavigationService;

    beforeEach(() => {
        auth.clearSession.mockReset();
        router.navigateByUrl.mockReset();
        router.navigateByUrl.mockResolvedValue(true);
        router.url = '/admin/flights/form';
        TestBed.configureTestingModule({
            providers: [
                UnauthorizedRedirectService,
                { provide: AuthService, useValue: auth },
                { provide: Router, useValue: router },
                { provide: GlobalService, useValue: global },
            ],
        });
        service = TestBed.inject(UnauthorizedRedirectService);
        navigationService = TestBed.inject(NavigationService);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should clear the session and open the sign in page on a catalog 401', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(401)));
        service.install();

        await window.fetch('/api/flights', { method: 'POST' });

        expect(auth.clearSession).toHaveBeenCalledOnce();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/sign-in');
        expect(navigationService.consumeForcedNavigation()).toBe(true);
    });


    it('should leave sign in failures on the form', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(401)));
        service.install();

        await window.fetch('/api/auth/login', { method: 'POST' });

        expect(auth.clearSession).not.toHaveBeenCalled();
        expect(router.navigateByUrl).not.toHaveBeenCalled();
    });


    it('should ignore successful responses', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200)));
        service.install();

        await window.fetch('/api/flights');

        expect(auth.clearSession).not.toHaveBeenCalled();
        expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
});
