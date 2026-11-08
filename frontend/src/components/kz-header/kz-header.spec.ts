import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_AUTH_SESSION } from '../../models/kz_auth_session.interface';
import { KzUserRole } from '../../models/kz_user_role.enum';
import { AuthService } from '../../services/auth.service';
import { KzHeader } from './kz-header';


function signIn(role: KzUserRole): void {
    TestBed.inject(AuthService).saveSession({
        ...DEFAULT_KZ_AUTH_SESSION,
        jeton: 'token',
        user: {
            ...DEFAULT_KZ_AUTH_SESSION.user,
            id: 1,
            name: 'Kamal',
            email: 'kamal@agency.travel',
            role,
        },
    });
}


describe('KzHeader', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [KzHeader],
            providers: [provideRouter([])],
        }).compileComponents();
    });


    it('should show the sign-in links when signed out', () => {
        const fixture = TestBed.createComponent(KzHeader);
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;

        expect(text).toContain('Atlas Trips');
        expect(text).toContain('Packages');
        expect(text).toContain('Sign in');
        expect(text).toContain('Sign up');
        expect(fixture.nativeElement.querySelector('kz-avatar')).toBeNull();
    });


    it('should toggle the mobile menu', () => {
        const fixture = TestBed.createComponent(KzHeader);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('.menu-toggle').click();
        fixture.detectChanges();

        expect(fixture.componentInstance.isMenuOpen).toBe(true);
        expect(fixture.nativeElement.querySelector('.main-nav').classList).toContain('is-open');

        fixture.nativeElement.querySelector('.menu-toggle').click();
        fixture.detectChanges();

        expect(fixture.componentInstance.isMenuOpen).toBe(false);
    });


    it('should show the avatar of a signed-in client', () => {
        signIn(KzUserRole.CLIENT);
        const fixture = TestBed.createComponent(KzHeader);
        fixture.detectChanges();

        const avatarLink = fixture.nativeElement.querySelector('.avatar-link');

        expect(avatarLink).toBeTruthy();
        expect(avatarLink.getAttribute('aria-label')).toBe('My profile');
        expect(fixture.nativeElement.querySelector('.kz-avatar').textContent).toContain('K');
    });


    it('should point an admin to the admin area with the gold avatar', () => {
        signIn(KzUserRole.ADMIN);
        const fixture = TestBed.createComponent(KzHeader);
        fixture.detectChanges();

        const avatarLink = fixture.nativeElement.querySelector('.avatar-link');

        expect(avatarLink.getAttribute('aria-label')).toBe('Admin area');
        expect(fixture.nativeElement.querySelector('.kz-avatar').classList).toContain('is-gold');
    });


    it('should navigate and close the menu from goTo', () => {
        const fixture = TestBed.createComponent(KzHeader);
        fixture.detectChanges();
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.toggleMenu();
        fixture.componentInstance.goTo('/flights');

        expect(navigate).toHaveBeenCalledWith('/flights');
        expect(fixture.componentInstance.isMenuOpen).toBe(false);
    });
});
