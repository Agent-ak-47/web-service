import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KzDialog } from './kz-dialog';


function createDialog(open = true): ComponentFixture<KzDialog> {
    const fixture = TestBed.createComponent(KzDialog);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('title', 'Delete');
    fixture.componentRef.setInput('message', 'Delete this flight?');

    return fixture;
}


describe('KzDialog', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzDialog] }).compileComponents();
    });


    it('should render nothing while closed', () => {
        const fixture = createDialog(false);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeNull();
    });


    it('should render the dialog content when open', () => {
        const fixture = createDialog();
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;

        expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
        expect(text).toContain('Delete');
        expect(text).toContain('Delete this flight?');
        expect(fixture.nativeElement.querySelectorAll('button').length).toBe(2);
    });


    it('should emit confirmed and cancelled from the buttons', () => {
        const fixture = createDialog();
        fixture.detectChanges();
        const confirmed = vi.fn();
        const cancelled = vi.fn();
        fixture.componentInstance.confirmed.subscribe(confirmed);
        fixture.componentInstance.cancelled.subscribe(cancelled);

        const buttons = fixture.nativeElement.querySelectorAll('button');
        buttons[0].click();
        buttons[1].click();

        expect(cancelled).toHaveBeenCalledOnce();
        expect(confirmed).toHaveBeenCalledOnce();
    });


    it('should only cancel when the backdrop itself is clicked', () => {
        const fixture = createDialog();
        fixture.detectChanges();
        const cancelled = vi.fn();
        fixture.componentInstance.cancelled.subscribe(cancelled);

        fixture.nativeElement.querySelector('.dialog-box').click();
        expect(cancelled).not.toHaveBeenCalled();

        fixture.nativeElement.querySelector('.dialog-backdrop').click();
        expect(cancelled).toHaveBeenCalledOnce();
    });


    it('should show the busy confirm label while loading', () => {
        const fixture = createDialog();
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');

        expect(buttons[1].textContent).toContain('Saving...');
        expect(buttons[0].disabled).toBe(true);
    });
});
