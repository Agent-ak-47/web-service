import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KzFieldType } from '../../models/kz_field_type.enum';
import { KzField } from './kz-field';


describe('KzField', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzField] }).compileComponents();
    });


    it('should render a text input with its label and required mark', () => {
        const fixture = TestBed.createComponent(KzField);
        fixture.componentRef.setInput('label', 'Full name');
        fixture.componentRef.setInput('required', true);
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('input');

        expect(input.type).toBe('text');
        expect(fixture.nativeElement.textContent).toContain('Full name');
        expect(fixture.nativeElement.querySelector('.kz-field-required').textContent).toContain('*');
    });


    it('should map field types to html types', () => {
        const fixture = TestBed.createComponent(KzField);
        fixture.componentRef.setInput('type', KzFieldType.EMAIL);
        expect(fixture.componentInstance.htmlType).toBe('email');

        fixture.componentRef.setInput('type', KzFieldType.PASSWORD);
        expect(fixture.componentInstance.htmlType).toBe('password');

        fixture.componentRef.setInput('type', KzFieldType.DATE);
        expect(fixture.componentInstance.htmlType).toBe('date');

        fixture.componentRef.setInput('type', KzFieldType.NUMBER);
        expect(fixture.componentInstance.htmlType).toBe('number');
    });


    it('should emit the typed value', () => {
        const fixture = TestBed.createComponent(KzField);
        fixture.detectChanges();
        const valueChange = vi.fn();
        fixture.componentInstance.valueChange.subscribe(valueChange);

        const input = fixture.nativeElement.querySelector('input');
        input.value = 'Paris';
        input.dispatchEvent(new Event('input'));

        expect(valueChange).toHaveBeenCalledWith('Paris');
    });


    it('should render a select with its options and emit changes', () => {
        const fixture = TestBed.createComponent(KzField);
        fixture.componentRef.setInput('type', KzFieldType.SELECT);
        fixture.componentRef.setInput('options', [
            { label: 'Pending', value: 'PENDING' },
            { label: 'Paid', value: 'PAID' },
        ]);
        fixture.detectChanges();
        const valueChange = vi.fn();
        fixture.componentInstance.valueChange.subscribe(valueChange);

        const select = fixture.nativeElement.querySelector('select');
        select.value = 'PAID';
        select.dispatchEvent(new Event('change'));

        expect(select.querySelectorAll('option').length).toBe(2);
        expect(valueChange).toHaveBeenCalledWith('PAID');
    });


    it('should render a textarea with its rows', () => {
        const fixture = TestBed.createComponent(KzField);
        fixture.componentRef.setInput('type', KzFieldType.TEXTAREA);
        fixture.componentRef.setInput('rows', 5);
        fixture.detectChanges();

        const textarea = fixture.nativeElement.querySelector('textarea');

        expect(textarea.rows).toBe(5);
    });


    it('should show the error instead of the hint and flag the control', () => {
        const fixture = TestBed.createComponent(KzField);
        fixture.componentRef.setInput('hint', 'Optional');
        fixture.componentRef.setInput('error', 'Required');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.kz-field-error').textContent).toContain('Required');
        expect(fixture.nativeElement.querySelector('.kz-field-hint')).toBeNull();
        expect(fixture.nativeElement.querySelector('.kz-control').classList).toContain('has-error');
    });
});
