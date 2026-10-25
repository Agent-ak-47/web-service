import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { KzIconName } from '../../../../../models/kz_icon_name.enum';
import { Hero } from './hero';


describe('Hero', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Hero],
            providers: [provideRouter([])],
        }).compileComponents();
    });


    it('should render the title, subtitle and action links', () => {
        const fixture = TestBed.createComponent(Hero);
        fixture.componentRef.setInput('title', 'Atlas Trips');
        fixture.componentRef.setInput('subtitle', 'Travel with us.');
        fixture.componentRef.setInput('actions', [
            { label: 'Packages', path: '/packages', icon: KzIconName.SUITCASE },
            { label: 'Flights', path: '/flights', icon: KzIconName.PLANE },
        ]);
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;

        expect(text).toContain('Atlas Trips');
        expect(text).toContain('Travel with us.');
        expect(fixture.nativeElement.querySelectorAll('a').length).toBe(2);
    });
});
