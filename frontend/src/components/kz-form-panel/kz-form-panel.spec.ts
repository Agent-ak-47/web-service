import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KzFieldType } from '../../models/kz_field_type.enum';
import { KzFormColumns } from '../../models/kz_form_columns.enum';
import { DEFAULT_KZ_FORM_FIELD } from '../../models/kz_form_field.interface';
import { KzFormSection } from '../../models/kz_form_section.interface';
import { KzFormPanel } from './kz-form-panel';


const SECTIONS: KzFormSection[] = [
    {
        id: 'identity',
        title: 'Identity',
        columns: KzFormColumns.TWO,
        fields: [
            {
                ...DEFAULT_KZ_FORM_FIELD,
                name: 'name',
                label: 'Name',
                value: 'Marrakech Escape',
                required: true,
            },
            {
                ...DEFAULT_KZ_FORM_FIELD,
                name: 'imageUrl',
                label: 'Image',
                type: KzFieldType.IMAGE,
            },
        ],
    },
];


function createPanel(): ComponentFixture<KzFormPanel> {
    const fixture = TestBed.createComponent(KzFormPanel);
    fixture.componentRef.setInput('sections', SECTIONS);

    return fixture;
}


describe('KzFormPanel', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzFormPanel] }).compileComponents();
    });


    it('should render the section title and its fields', () => {
        const fixture = createPanel();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Identity');
        expect(fixture.nativeElement.querySelector('input[name="name"]').value).toBe('Marrakech Escape');
        expect(fixture.nativeElement.querySelector('kz-upload-img')).toBeTruthy();
    });


    it('should emit saved and cancelled from the action buttons', () => {
        const fixture = createPanel();
        fixture.detectChanges();
        const saved = vi.fn();
        const cancelled = vi.fn();
        fixture.componentInstance.saved.subscribe(saved);
        fixture.componentInstance.cancelled.subscribe(cancelled);

        const buttons = fixture.nativeElement.querySelectorAll('.form-actions button');
        buttons[0].click();
        buttons[1].click();

        expect(saved).toHaveBeenCalledOnce();
        expect(cancelled).toHaveBeenCalledOnce();
    });


    it('should emit a field change with the field name', () => {
        const fixture = createPanel();
        fixture.detectChanges();
        const fieldChange = vi.fn();
        fixture.componentInstance.fieldChange.subscribe(fieldChange);

        const input = fixture.nativeElement.querySelector('input[name="name"]');
        input.value = 'New name';
        input.dispatchEvent(new Event('input'));

        expect(fieldChange).toHaveBeenCalledWith({ name: 'name', value: 'New name' });
    });


    it('should show the validation message and the active toggle', () => {
        const fixture = createPanel();
        fixture.componentRef.setInput('validationMessage', 'Fix the fields in error before saving.');
        fixture.componentRef.setInput('activeLabel', 'Active');
        fixture.detectChanges();
        const activeToggled = vi.fn();
        fixture.componentInstance.activeToggled.subscribe(activeToggled);

        expect(fixture.nativeElement.querySelector('.kz-error').textContent).toContain('Fix the fields');

        fixture.nativeElement.querySelectorAll('.form-actions button')[2].click();
        expect(activeToggled).toHaveBeenCalledOnce();
    });


    it('should map form columns to row classes', () => {
        const fixture = createPanel();

        expect(fixture.componentInstance.rowClasses(KzFormColumns.ONE)).toBe('form-row');
        expect(fixture.componentInstance.rowClasses(KzFormColumns.TWO)).toBe('form-row is-two');
        expect(fixture.componentInstance.rowClasses(KzFormColumns.THREE)).toBe('form-row is-three');
    });
});
