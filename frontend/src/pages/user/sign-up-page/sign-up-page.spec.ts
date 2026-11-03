import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_AUTH_SESSION } from '../../../models/kz_auth_session.interface';
import { DEFAULT_KZ_USER } from '../../../models/kz_user.interface';
import { SignUpPage } from './sign-up-page';


const SESSION = {
    ...DEFAULT_KZ_AUTH_SESSION,
    jeton: 'new-token',
    user: { ...DEFAULT_KZ_USER, id: 2, email: 'new@agency.travel' },
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('SignUpPage', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [SignUpPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should validate the email, password and confirmation', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(SignUpPage);

        fixture.componentInstance.onEmailChange('not-an-email');
        fixture.componentInstance.onPasswordChange('short');
        fixture.componentInstance.onConfirmPasswordChange('different');
        await fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.emailError).toBe('Enter a valid email address.');
        expect(fixture.componentInstance.passwordError).toBe('The password must contain at least 8 characters.');
        expect(fixture.componentInstance.confirmPasswordError).toBe('The passwords do not match.');
        expect(fetchMock).not.toHaveBeenCalled();
    });


    it('should store the session and navigate to the profile after sign up', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response({ data: SESSION }));
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(SignUpPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.onEmailChange('new@agency.travel');
        fixture.componentInstance.onPasswordChange('Password123!');
        fixture.componentInstance.onConfirmPasswordChange('Password123!');
        await fixture.componentInstance.onSubmit();

        expect(localStorage.getItem('kz_token')).toBe('new-token');
        expect(navigate).toHaveBeenCalledWith('/profile');
    });


    it('should show the duplicate email message', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            error: { code: 'DUPLICATE', message: 'Duplicate.' },
        }, 409)));
        const fixture = TestBed.createComponent(SignUpPage);

        fixture.componentInstance.onEmailChange('client@agency.travel');
        fixture.componentInstance.onPasswordChange('Password123!');
        fixture.componentInstance.onConfirmPasswordChange('Password123!');
        await fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.errorMessage).toBe('This email is already used.');
    });


    it('should clear a field error when the field changes', () => {
        const fixture = TestBed.createComponent(SignUpPage);
        fixture.componentInstance.emailError = 'Enter a valid email address.';

        fixture.componentInstance.onEmailChange('client@agency.travel');

        expect(fixture.componentInstance.emailError).toBe('');
    });
});
