import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KzFieldType } from '../../models/kz_field_type.enum';
import { KzFilterField } from '../../models/kz_filter_field.interface';
import { KzFilterBar } from './kz-filter-bar';


const FIELDS: KzFilterField[] = [
    {
        name: 'departureCity',
        label: 'Departure',
        type: KzFieldType.TEXT,
        value: 'Casablanca',
        placeholder: 'Casablanca',
        options: [],
    },
    {
        name: 'arrivalCity',
        label: 'Arrival',
        type: KzFieldType.TEXT,
        value: 'Paris',
        placeholder: 'Paris',
        options: [],
    },
];


function createFilterBar(): ComponentFixture<KzFilterBar> {
    const fixture = TestBed.createComponent(KzFilterBar);
    fixture.componentRef.setInput('fields', FIELDS);

    return fixture;
}


describe('KzFilterBar', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzFilterBar] }).compileComponents();
    });


    it('should render one field per filter', () => {
        const fixture = createFilterBar();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('kz-field').length).toBe(2);
    });


    it('should emit the full values when a field changes', () => {
        const fixture = createFilterBar();
        fixture.detectChanges();
        const changed = vi.fn();
        fixture.componentInstance.changed.subscribe(changed);

        const input = fixture.nativeElement.querySelector('input');
        input.value = 'Marrakech';
        input.dispatchEvent(new Event('input'));

        expect(changed).toHaveBeenCalledWith({
            departureCity: 'Marrakech',
            arrivalCity: 'Paris',
        });
    });


    it('should emit the values on submit', () => {
        const fixture = createFilterBar();
        fixture.detectChanges();
        const submitted = vi.fn();
        fixture.componentInstance.submitted.subscribe(submitted);

        fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

        expect(submitted).toHaveBeenCalledWith({
            departureCity: 'Casablanca',
            arrivalCity: 'Paris',
        });
    });


    it('should emit empty values and reseted on reset', () => {
        const fixture = createFilterBar();
        fixture.detectChanges();
        const changed = vi.fn();
        const reseted = vi.fn();
        fixture.componentInstance.changed.subscribe(changed);
        fixture.componentInstance.reseted.subscribe(reseted);

        const buttons = fixture.nativeElement.querySelectorAll('button');
        buttons[1].click();

        expect(changed).toHaveBeenCalledWith({ departureCity: '', arrivalCity: '' });
        expect(reseted).toHaveBeenCalledOnce();
    });


    it('should disable both buttons while loading', () => {
        const fixture = createFilterBar();
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');

        expect(buttons[0].disabled).toBe(true);
        expect(buttons[1].disabled).toBe(true);
    });
});
