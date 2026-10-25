import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { KzBreadcrumb } from './kz-breadcrumb';


describe('KzBreadcrumb', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KzBreadcrumb],
            providers: [provideRouter([])],
        }).compileComponents();
    });


    it('should create the breadcrumb navigation with its label', () => {
        const fixture = TestBed.createComponent(KzBreadcrumb);
        fixture.componentRef.setInput('items', [{ label: 'Home', path: '/' }]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe('Breadcrumb');
    });


    it('should render links and mark the last item as current', () => {
        const fixture = TestBed.createComponent(KzBreadcrumb);
        fixture.componentRef.setInput('items', [
            { label: 'Home', path: '/' },
            { label: 'Flights', path: '/flights' },
            { label: 'Flight 1', path: '' },
        ]);
        fixture.detectChanges();

        const links = fixture.nativeElement.querySelectorAll('a.crumb');
        const current = fixture.nativeElement.querySelector('.is-current');

        expect(links.length).toBe(2);
        expect(links[0].textContent).toContain('Home');
        expect(current.textContent).toContain('Flight 1');
        expect(current.getAttribute('aria-current')).toBe('page');
    });


    it('should not render links for a single current item', () => {
        const fixture = TestBed.createComponent(KzBreadcrumb);
        fixture.componentRef.setInput('items', [{ label: 'Only', path: '' }]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('a').length).toBe(0);
        expect(fixture.nativeElement.querySelectorAll('.separator').length).toBe(0);
    });
});
