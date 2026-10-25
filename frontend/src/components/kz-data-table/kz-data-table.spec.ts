import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KzCellFormat, KzTableAction, KzTableRow } from '../../models/kz_table.interface';
import { KzDataTable } from './kz-data-table';


const ROWS: KzTableRow[] = [
    {
        id: 1,
        cells: {
            reference: 'AT-1',
            price: 1200,
            date: '2026-11-04',
            status: 'PENDING',
            active: true,
            count: 2,
        },
        actions: [KzTableAction.CANCEL],
    },
];


const COLUMNS = [
    { key: 'reference', label: 'Reference', format: KzCellFormat.TEXT },
    { key: 'price', label: 'Total', format: KzCellFormat.PRICE },
    { key: 'date', label: 'Date', format: KzCellFormat.DATE },
    { key: 'status', label: 'Status', format: KzCellFormat.STATUS },
    { key: 'active', label: 'Active', format: KzCellFormat.BOOLEAN },
    { key: 'count', label: 'Quantity', format: KzCellFormat.NUMBER },
];


describe('KzDataTable', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzDataTable] }).compileComponents();
    });


    it('should show the empty label when there are no rows', () => {
        const fixture = TestBed.createComponent(KzDataTable);
        fixture.componentRef.setInput('columns', COLUMNS);
        fixture.componentRef.setInput('emptyLabel', 'No booking yet.');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.kz-empty').textContent).toContain('No booking yet.');
        expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });


    it('should show the loading state when loading', () => {
        const fixture = TestBed.createComponent(KzDataTable);
        fixture.componentRef.setInput('columns', COLUMNS);
        fixture.componentRef.setInput('rows', ROWS);
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('kz-loading')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });


    it('should render each supported cell format', () => {
        const fixture = TestBed.createComponent(KzDataTable);
        fixture.componentRef.setInput('columns', COLUMNS);
        fixture.componentRef.setInput('rows', ROWS);
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;

        expect(text).toContain('AT-1');
        expect(text).toContain('1200.00 MAD');
        expect(text).toContain('11/04/2026');
        expect(text).toContain('Pending');
        expect(text).toContain('Yes');
        expect(fixture.nativeElement.querySelectorAll('th.is-right').length).toBe(2);
    });


    it('should emit the selected action and row id', () => {
        const fixture = TestBed.createComponent(KzDataTable);
        fixture.componentRef.setInput('columns', COLUMNS);
        fixture.componentRef.setInput('rows', ROWS);
        fixture.detectChanges();
        const actionDone = vi.fn();
        fixture.componentInstance.actionDone.subscribe(actionDone);

        fixture.nativeElement.querySelector('.actions-cell button').click();

        expect(actionDone).toHaveBeenCalledWith({ action: KzTableAction.CANCEL, rowId: 1 });
    });


    it('should hide the actions column when no row has actions', () => {
        const fixture = TestBed.createComponent(KzDataTable);
        fixture.componentRef.setInput('columns', COLUMNS);
        fixture.componentRef.setInput('rows', [{ id: 2, cells: { reference: 'AT-2' } }]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.actions-head')).toBeNull();
    });
});
