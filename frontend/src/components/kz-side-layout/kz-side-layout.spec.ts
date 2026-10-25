import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KzIconName } from '../../models/kz_icon_name.enum';
import { SessionService } from '../../services/session.service';
import { KzSideLayout } from './kz-side-layout';


const logout = vi.fn().mockResolvedValue(undefined);


describe('KzSideLayout', () => {
    beforeEach(async () => {
        logout.mockClear();
        await TestBed.configureTestingModule({
            imports: [KzSideLayout],
            providers: [
                provideRouter([]),
                { provide: SessionService, useValue: { logout } },
            ],
        }).compileComponents();
    });


    it('should render the title, hint and links', () => {
        const fixture = TestBed.createComponent(KzSideLayout);
        fixture.componentRef.setInput('title', 'Administration');
        fixture.componentRef.setInput('hint', 'Manage the catalog.');
        fixture.componentRef.setInput('links', [
            { label: 'Dashboard', path: '/admin', icon: KzIconName.STAR, exact: true },
            { label: 'Flights', path: '/admin/flights', icon: KzIconName.PLANE, exact: true },
        ]);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Administration');
        expect(fixture.nativeElement.textContent).toContain('Manage the catalog.');
        expect(fixture.nativeElement.querySelectorAll('.aside-link').length).toBe(2);
    });


    it('should only show the logout button when a label is provided', () => {
        const fixture = TestBed.createComponent(KzSideLayout);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.aside-foot')).toBeNull();

        fixture.componentRef.setInput('logoutLabel', 'Log out');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.aside-foot')).toBeTruthy();
    });


    it('should log out through the session service', async () => {
        const fixture = TestBed.createComponent(KzSideLayout);
        fixture.componentRef.setInput('logoutLabel', 'Log out');
        fixture.detectChanges();

        await fixture.componentInstance.onLogout();

        expect(logout).toHaveBeenCalledOnce();
        expect(fixture.componentInstance.isSigningOut).toBe(false);
    });
});
