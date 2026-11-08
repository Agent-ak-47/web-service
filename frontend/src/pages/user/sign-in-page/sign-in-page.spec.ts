import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_AUTH_SESSION } from '../../../models/kz_auth_session.interface';
import { DEFAULT_KZ_USER } from '../../../models/kz_user.interface';
import { AuthService } from '../../../services/auth.service';
import { SignInPage } from './sign-in-page';


const SESSION = {
    ...DEFAULT_KZ_AUTH_SESSION,
    jeton: 'token',
    user: { ...DEFAULT_KZ_USER, id: 1, email: 'client@agency.travel' },
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('SignInPage', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [SignInPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should create the form with empty credentials', () => {
        const fixture = TestBed.createComponent(SignInPage);
        fixture.detectChanges();

        expect(fixture.componentInstance.form.email).toBe('');
        expect(fixture.componentInstance.form.password).toBe('');
        expect(fixture.nativeElement.textContent).toContain('Sign in');
    });


    it('should track changes to the credentials', () => {
        const fixture = TestBed.createComponent(SignInPage);

        fixture.componentInstance.onEmailChange('client@agency.travel');
        fixture.componentInstance.onPasswordChange('Password123!');

        expect(fixture.componentInstance.form.email).toBe('client@agency.travel');
        expect(fixture.componentInstance.form.password).toBe('Password123!');
        expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
    });


    it('should store the session and navigate home after a successful sign in', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: SESSION }));
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(SignInPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.form = {
            email: 'client@agency.travel',
            password: 'Password123!',
        };
        await fixture.componentInstance.onSubmit();

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(localStorage.getItem('kz_token')).toBe('token');
        expect(navigate).toHaveBeenCalledWith('/');
    });


    it('should show the API error message when the sign in fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        }, 401)));
        const fixture = TestBed.createComponent(SignInPage);

        await fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.errorMessage).toBe('Invalid email or password.');
    });


    it('should redirect an already signed-in user', () => {
        TestBed.inject(AuthService).saveSession(SESSION);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
        const fixture = TestBed.createComponent(SignInPage);

        fixture.detectChanges();

        expect(navigate).toHaveBeenCalledWith('/');
    });
});
