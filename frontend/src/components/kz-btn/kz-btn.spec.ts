import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KzTone } from '../../models/kz_tone.enum';
import { KzBtn } from './kz-btn';


function createButton(): ComponentFixture<KzBtn> {
    const fixture = TestBed.createComponent(KzBtn);
    fixture.componentRef.setInput('label', 'Save');

    return fixture;
}


describe('KzBtn', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzBtn] }).compileComponents();
    });


    it('should render its label and emit clicked on click', () => {
        const fixture = createButton();
        fixture.detectChanges();
        const clicked = vi.fn();
        fixture.componentInstance.clicked.subscribe(clicked);

        const button = fixture.nativeElement.querySelector('button');
        button.click();

        expect(button.textContent).toContain('Save');
        expect(clicked).toHaveBeenCalledOnce();
    });


    it('should not emit when disabled', () => {
        const fixture = createButton();
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();
        const clicked = vi.fn();
        fixture.componentInstance.clicked.subscribe(clicked);

        fixture.componentInstance.onClick();

        expect(clicked).not.toHaveBeenCalled();
        expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    });


    it('should show a spinner while loading and not emit', () => {
        const fixture = createButton();
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();
        const clicked = vi.fn();
        fixture.componentInstance.clicked.subscribe(clicked);

        fixture.componentInstance.onClick();

        expect(fixture.nativeElement.querySelector('.kz-spinner')).toBeTruthy();
        expect(clicked).not.toHaveBeenCalled();
    });


    it('should build classes for kind, full width and icon-only buttons', () => {
        const fixture = createButton();
        fixture.componentRef.setInput('kind', KzBtnKind.DANGER);
        fixture.componentRef.setInput('fullWidth', true);
        fixture.componentRef.setInput('iconOnly', true);
        fixture.componentRef.setInput('hasIcon', true);
        fixture.componentRef.setInput('icon', {
            name: KzIconName.TRASH,
            size: KzIconSize.SM,
            tone: KzTone.NEUTRAL,
        });
        fixture.detectChanges();

        const button = fixture.nativeElement.querySelector('button');

        expect(button.classList).toContain('kind-danger');
        expect(button.classList).toContain('is-full');
        expect(button.classList).toContain('is-compact');
        expect(button.querySelectorAll('kz-icon').length).toBe(1);
    });
});
