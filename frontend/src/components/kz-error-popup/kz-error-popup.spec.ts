import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KzErrorPopup } from './kz-error-popup';


function createPopup(open = true): ComponentFixture<KzErrorPopup> {
    const fixture = TestBed.createComponent(KzErrorPopup);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('message', 'The server is unreachable.');

    return fixture;
}


describe('KzErrorPopup', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzErrorPopup] }).compileComponents();
    });


    it('should render nothing while closed', () => {
        const fixture = createPopup(false);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.error-backdrop')).toBeNull();
    });


    it('should render the error and a close button', () => {
        const fixture = createPopup();
        fixture.componentRef.setInput('hint', 'Check that the backend is running.');
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;

        expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
        expect(text).toContain('Something went wrong');
        expect(text).toContain('The server is unreachable.');
        expect(text).toContain('Check that the backend is running.');
        expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);
    });


    it('should emit closed from the button', () => {
        const fixture = createPopup();
        fixture.detectChanges();
        const closed = vi.fn();
        fixture.componentInstance.closed.subscribe(closed);

        fixture.nativeElement.querySelector('button').click();

        expect(closed).toHaveBeenCalledOnce();
    });


    it('should only close when the backdrop itself is clicked', () => {
        const fixture = createPopup();
        fixture.detectChanges();
        const closed = vi.fn();
        fixture.componentInstance.closed.subscribe(closed);

        fixture.nativeElement.querySelector('.error-box').click();
        expect(closed).not.toHaveBeenCalled();

        fixture.nativeElement.querySelector('.error-backdrop').click();
        expect(closed).toHaveBeenCalledOnce();
    });


    it('should close on Escape only while open', () => {
        const fixture = createPopup(false);
        fixture.detectChanges();
        const closed = vi.fn();
        fixture.componentInstance.closed.subscribe(closed);

        fixture.componentInstance.onEscape();
        expect(closed).not.toHaveBeenCalled();

        fixture.componentRef.setInput('open', true);
        fixture.componentInstance.onEscape();
        expect(closed).toHaveBeenCalledOnce();
    });
});
