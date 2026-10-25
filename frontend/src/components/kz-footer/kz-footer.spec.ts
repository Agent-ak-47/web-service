import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { KzFooter } from './kz-footer';


describe('KzFooter', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KzFooter],
            providers: [provideRouter([])],
        }).compileComponents();
    });


    it('should render the brand, the links and the contact details', () => {
        const fixture = TestBed.createComponent(KzFooter);
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;

        expect(text).toContain('Atlas Trips');
        expect(text).toContain('Packages');
        expect(text).toContain('Flights');
        expect(text).toContain('Excursions');
        expect(text).toContain('My bookings');
        expect(text).toContain('contact@atlas-trips.travel');
        expect(text).toContain('+212 5 22 00 00 00');
    });


    it('should render the current year and the rights label', () => {
        const fixture = TestBed.createComponent(KzFooter);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain(String(new Date().getFullYear()));
        expect(fixture.nativeElement.textContent).toContain('All rights reserved.');
    });


    it('should build three product links and three company links', () => {
        const fixture = TestBed.createComponent(KzFooter);
        fixture.detectChanges();

        expect(fixture.componentInstance.productLinks.length).toBe(3);
        expect(fixture.componentInstance.companyLinks.length).toBe(3);
    });
});
