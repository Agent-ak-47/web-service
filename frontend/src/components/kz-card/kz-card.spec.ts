import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    DEFAULT_KZ_ITEM_CARD_DATA,
    KzItemCardData,
} from '../../models/kz_item_card_data.interface';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzItemType } from '../../models/kz_item_type.enum';
import { KzTone } from '../../models/kz_tone.enum';
import { KzCard } from './kz-card';


const CARD: KzItemCardData = {
    ...DEFAULT_KZ_ITEM_CARD_DATA,
    id: 7,
    type: KzItemType.FLIGHT,
    title: 'Casablanca - Paris',
    subtitle: 'Royal Air Maroc AT100',
    icon: KzIconName.PLANE,
    price: 1200,
    unitLabel: 'per passenger',
    badge: 'Available',
    badgeTone: KzTone.SUCCESS,
    meta: [{ label: 'Departure', value: '11/04/2026' }],
    actionLabel: 'Book',
    disabledLabel: 'Booked',
};


describe('KzCard', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzCard] }).compileComponents();
    });


    it('should render the card content', () => {
        const fixture = TestBed.createComponent(KzCard);
        fixture.componentRef.setInput('data', CARD);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Casablanca - Paris');
        expect(fixture.nativeElement.textContent).toContain('1200.00 MAD');
        expect(fixture.nativeElement.textContent).toContain('11/04/2026');
        expect(fixture.nativeElement.querySelector('.kz-badge').textContent).toContain('Available');
    });


    it('should emit opened when clicked', () => {
        const fixture = TestBed.createComponent(KzCard);
        fixture.componentRef.setInput('data', CARD);
        fixture.detectChanges();
        const opened = vi.fn();
        fixture.componentInstance.opened.subscribe(opened);

        fixture.nativeElement.querySelector('article').click();

        expect(opened).toHaveBeenCalledWith(CARD);
    });


    it('should not open while loading', () => {
        const fixture = TestBed.createComponent(KzCard);
        fixture.componentRef.setInput('data', CARD);
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();
        const opened = vi.fn();
        fixture.componentInstance.opened.subscribe(opened);

        fixture.componentInstance.onOpen();

        expect(opened).not.toHaveBeenCalled();
        expect(fixture.nativeElement.querySelector('article').getAttribute('tabindex')).toBe('-1');
    });


    it('should emit reserved unless the card is disabled', () => {
        const fixture = TestBed.createComponent(KzCard);
        fixture.componentRef.setInput('data', CARD);
        fixture.detectChanges();
        const reserved = vi.fn();
        fixture.componentInstance.reserved.subscribe(reserved);

        fixture.componentInstance.onReserve();
        expect(reserved).toHaveBeenCalledWith(CARD);

        fixture.componentRef.setInput('data', { ...CARD, disabled: true });
        fixture.detectChanges();
        fixture.componentInstance.onReserve();

        expect(reserved).toHaveBeenCalledTimes(1);
        expect(fixture.nativeElement.textContent).toContain('Booked');
    });
});
