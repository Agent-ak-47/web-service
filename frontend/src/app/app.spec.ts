import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';


describe('App', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideRouter([])],
        }).compileComponents();
    });


    it('should create the application shell', () => {
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('kz-header')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('kz-footer')).toBeTruthy();
    });
});
