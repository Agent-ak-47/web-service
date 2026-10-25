import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { UserLayout } from './user-layout';


describe('UserLayout', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserLayout],
            providers: [provideRouter([])],
        }).compileComponents();
    });


    it('should build the profile and bookings links', () => {
        const fixture = TestBed.createComponent(UserLayout);
        fixture.detectChanges();

        expect(fixture.componentInstance.links.map((link) => link.path)).toEqual([
            '/profile',
            '/profile/reservations',
        ]);
        expect(fixture.nativeElement.textContent).toContain('My account');
    });


    it('should configure the menu and the logout label', () => {
        const fixture = TestBed.createComponent(UserLayout);

        expect(fixture.componentInstance.MENU_TITLE).toBe('My account');
        expect(fixture.componentInstance.MENU_HINT).toBe('Your details and your bookings.');
        expect(fixture.componentInstance.LOGOUT_LABEL).toBe('Log out');
    });
});
