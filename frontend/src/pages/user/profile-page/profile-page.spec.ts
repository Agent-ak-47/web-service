import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_AUTH_SESSION } from '../../../models/kz_auth_session.interface';
import { DEFAULT_KZ_USER } from '../../../models/kz_user.interface';
import { AuthService } from '../../../services/auth.service';
import { ProfilePage } from './profile-page';


const SESSION = {
    ...DEFAULT_KZ_AUTH_SESSION,
    jeton: 'token',
    user: {
        ...DEFAULT_KZ_USER,
        id: 1,
        name: 'Kamal',
        email: 'kamal@agency.travel',
        phone: '+212600000000',
        address: 'Casablanca',
    },
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('ProfilePage', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        await TestBed.configureTestingModule({
            imports: [ProfilePage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should fill the form from the signed-in user', () => {
        TestBed.inject(AuthService).saveSession(SESSION);
        const fixture = TestBed.createComponent(ProfilePage);
        fixture.detectChanges();

        expect(fixture.componentInstance.user?.name).toBe('Kamal');
        expect(fixture.componentInstance.form).toEqual({
            name: 'Kamal',
            email: 'kamal@agency.travel',
            phone: '+212600000000',
            address: 'Casablanca',
        });
        expect(fixture.componentInstance.isLoading).toBe(false);
    });


    it('should detect unsaved changes', () => {
        TestBed.inject(AuthService).saveSession(SESSION);
        const fixture = TestBed.createComponent(ProfilePage);
        fixture.detectChanges();

        expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);

        fixture.componentInstance.onNameChange('Kamal A.');

        expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
    });


    it('should require a name before saving', async () => {
        TestBed.inject(AuthService).saveSession(SESSION);
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const fixture = TestBed.createComponent(ProfilePage);
        fixture.detectChanges();

        fixture.componentInstance.onNameChange('   ');
        await fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.nameError).toBe('The name is required.');
        expect(fetchMock).not.toHaveBeenCalled();
    });


    it('should save the profile and refresh the user', async () => {
        TestBed.inject(AuthService).saveSession(SESSION);
        const updated = { ...SESSION, user: { ...SESSION.user, name: 'Kamal A.' } };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: updated })));
        const fixture = TestBed.createComponent(ProfilePage);
        fixture.detectChanges();

        fixture.componentInstance.onNameChange('Kamal A.');
        await fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.user?.name).toBe('Kamal A.');
        expect(fixture.componentInstance.isSaved).toBe(true);
    });
});
