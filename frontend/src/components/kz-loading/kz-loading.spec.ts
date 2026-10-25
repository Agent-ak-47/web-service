import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { KzLoading } from './kz-loading';


describe('KzLoading', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzLoading] }).compileComponents();
    });


    it('should create and show the default label', () => {
        const fixture = TestBed.createComponent(KzLoading);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Loading...');
    });


    it('should render a custom label and the compact class', () => {
        const fixture = TestBed.createComponent(KzLoading);
        fixture.componentRef.setInput('label', 'Fetching flights');
        fixture.componentRef.setInput('compact', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Fetching flights');
        expect(fixture.nativeElement.querySelector('.loading-box').classList).toContain('is-compact');
    });
});
