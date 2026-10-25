import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { AdminLayout } from './admin-layout';


describe('AdminLayout', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminLayout],
            providers: [provideRouter([])],
        }).compileComponents();
    });


    it('should build every administration link', () => {
        const fixture = TestBed.createComponent(AdminLayout);
        fixture.detectChanges();

        expect(fixture.componentInstance.links.map((link) => link.path)).toEqual([
            '/admin',
            '/admin/flights',
            '/admin/packages',
            '/admin/excursions',
            '/admin/reservations',
        ]);
        expect(fixture.nativeElement.textContent).toContain('Administration');
    });


    it('should expose the administration menu copy', () => {
        const fixture = TestBed.createComponent(AdminLayout);

        expect(fixture.componentInstance.MENU_HINT).toBe('Catalog and booking management.');
        expect(fixture.componentInstance.LOGOUT_LABEL).toBe('Log out');
    });
});
