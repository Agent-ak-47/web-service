import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    DEFAULT_KZ_ITEM_DETAIL_DATA,
    KzItemDetailData,
} from '../../models/kz_item_detail_data.interface';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzItemType } from '../../models/kz_item_type.enum';
import { KzTone } from '../../models/kz_tone.enum';
import { KzItemDetail } from './kz-item-detail';


const DETAIL: KzItemDetailData = {
    ...DEFAULT_KZ_ITEM_DETAIL_DATA,
    id: 7,
    type: KzItemType.PACKAGE,
    title: 'Marrakech Escape',
    subtitle: 'Marrakech',
    icon: KzIconName.SUITCASE,
    description: 'A full stay with flights and excursions.',
    price: 100,
    unitLabel: 'per person',
    badge: '-25%',
    badgeTone: KzTone.SUCCESS,
    rows: [{ label: 'Destination', value: 'Marrakech' }],
    sections: [{ id: 'flights', title: 'Flights included', rows: [{ label: 'AT100', value: 'Casablanca' }] }],
    actionLabel: 'Book',
    disabledLabel: 'Booked',
    maxQuantity: 3,
};


function createDetail(): ComponentFixture<KzItemDetail> {
    const fixture = TestBed.createComponent(KzItemDetail);
    fixture.componentRef.setInput('data', DETAIL);
    fixture.componentRef.setInput('quantityLabel', 'Guests');

    return fixture;
}


describe('KzItemDetail', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzItemDetail] }).compileComponents();
    });


    it('should render the details, rows and sections', () => {
        const fixture = createDetail();
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;

        expect(text).toContain('Marrakech Escape');
        expect(text).toContain('A full stay with flights and excursions.');
        expect(text).toContain('100.00 MAD');
        expect(text).toContain('Destination');
        expect(text).toContain('Flights included');
        expect(fixture.nativeElement.querySelector('.kz-badge').textContent).toContain('-25%');
    });


    it('should show the quantity field and the computed total', () => {
        const fixture = createDetail();
        fixture.componentRef.setInput('quantity', 2);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('input[type="number"]')).toBeTruthy();
        expect(fixture.nativeElement.textContent).toContain('200.00 MAD');
    });


    it('should emit the quantity, clamped to the maximum', () => {
        const fixture = createDetail();
        fixture.detectChanges();
        const quantityChanged = vi.fn();
        fixture.componentInstance.quantityChanged.subscribe(quantityChanged);

        fixture.componentInstance.onQuantityInput('5');
        fixture.componentInstance.onQuantityInput('0');

        expect(quantityChanged).toHaveBeenCalledOnce();
        expect(quantityChanged).toHaveBeenCalledWith(3);
    });


    it('should emit reserved with the current quantity', () => {
        const fixture = createDetail();
        fixture.componentRef.setInput('quantity', 2);
        fixture.detectChanges();
        const reserved = vi.fn();
        fixture.componentInstance.reserved.subscribe(reserved);

        fixture.componentInstance.onAction();

        expect(reserved).toHaveBeenCalledWith(2);
    });


    it('should disable the action and show its disabled label', () => {
        const fixture = createDetail();
        fixture.componentRef.setInput('data', { ...DETAIL, disabled: true });
        fixture.detectChanges();
        const reserved = vi.fn();
        fixture.componentInstance.reserved.subscribe(reserved);

        fixture.componentInstance.onAction();

        expect(reserved).not.toHaveBeenCalled();
        expect(fixture.nativeElement.querySelector('.detail-aside button').textContent).toContain('Booked');
    });
});
