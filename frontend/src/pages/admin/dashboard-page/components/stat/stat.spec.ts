import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { KzIconName } from '../../../../../models/kz_icon_name.enum';
import { KzTone } from '../../../../../models/kz_tone.enum';
import { Stat } from './stat';


describe('Stat', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [Stat] }).compileComponents();
    });


    it('should render the label, value and hint', () => {
        const fixture = TestBed.createComponent(Stat);
        fixture.componentRef.setInput('label', 'Bookings');
        fixture.componentRef.setInput('value', '12');
        fixture.componentRef.setInput('hint', 'All bookings');
        fixture.componentRef.setInput('icon', KzIconName.RECEIPT);
        fixture.componentRef.setInput('tone', KzTone.SUCCESS);
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;

        expect(text).toContain('Bookings');
        expect(text).toContain('12');
        expect(text).toContain('All bookings');
        expect(fixture.nativeElement.querySelector('kz-icon')).toBeTruthy();
    });
});
