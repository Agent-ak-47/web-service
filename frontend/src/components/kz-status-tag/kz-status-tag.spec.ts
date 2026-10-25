import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { KzReservationStatus } from '../../models/kz_reservation_status.enum';
import { KzTone } from '../../models/kz_tone.enum';
import { KzStatusTag } from './kz-status-tag';


describe('KzStatusTag', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzStatusTag] }).compileComponents();
    });


    it('should map a reservation status to its label and tone', () => {
        const fixture = TestBed.createComponent(KzStatusTag);
        fixture.componentRef.setInput('value', KzReservationStatus.PAID);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Paid');
        expect(fixture.nativeElement.querySelector('.kz-badge').classList).toContain('kz-tone-success');
    });


    it('should map a cancelled booking to the danger tone', () => {
        const fixture = TestBed.createComponent(KzStatusTag);
        fixture.componentRef.setInput('value', KzReservationStatus.CANCELLED);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Cancelled');
        expect(fixture.componentInstance.tone).toBe(KzTone.DANGER);
    });


    it('should fall back to the raw value and neutral tone when unknown', () => {
        const fixture = TestBed.createComponent(KzStatusTag);
        fixture.componentRef.setInput('value', 'SOMETHING_ELSE');
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('SOMETHING_ELSE');
        expect(fixture.componentInstance.tone).toBe(KzTone.NEUTRAL);
    });
});
