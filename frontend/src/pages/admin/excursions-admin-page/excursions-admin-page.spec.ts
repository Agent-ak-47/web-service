import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_EXCURSION, KzExcursion } from '../../../models/kz_excursion.interface';
import { KzTableAction, KzTableActionEvent } from '../../../models/kz_table.interface';
import { GlobalService } from '../../../services/global.service';
import { ExcursionsAdminPage } from './excursions-admin-page';


const EXCURSION: KzExcursion = {
    ...DEFAULT_KZ_EXCURSION,
    id: 3,
    title: 'Medina walking tour',
    location: 'Marrakech',
    date: '2026-11-04',
    dureeMinutes: 150,
    capacity: 20,
    availableSeats: 6,
    price: 300,
    guide: 'Youssef',
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


function actionEvent(action: KzTableAction, rowId: number): KzTableActionEvent {
    return { action, rowId };
}


describe('ExcursionsAdminPage', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExcursionsAdminPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should load the excursions into the table', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [EXCURSION] })));
        const fixture = TestBed.createComponent(ExcursionsAdminPage);

        await fixture.componentInstance.loadExcursions();

        expect(fixture.componentInstance.excursions.length).toBe(1);
        expect(fixture.componentInstance.rows[0].cells['title']).toBe('Medina walking tour');
        expect(fixture.componentInstance.rows[0].cells['duration']).toBe(150);
    });


    it('should filter the excursions by title, location and guide', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [EXCURSION] })));
        const fixture = TestBed.createComponent(ExcursionsAdminPage);
        await fixture.componentInstance.loadExcursions();

        fixture.componentInstance.onSearchChanged({ search: 'youssef' });
        expect(fixture.componentInstance.rows.length).toBe(1);

        fixture.componentInstance.onSearchChanged({ search: 'fes' });
        expect(fixture.componentInstance.rows.length).toBe(0);
    });


    it('should navigate to the edit and create forms', () => {
        const fixture = TestBed.createComponent(ExcursionsAdminPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
        fixture.componentInstance.excursions = [EXCURSION];

        fixture.componentInstance.onActionDone(actionEvent(KzTableAction.EDIT, EXCURSION.id));
        expect(navigate).toHaveBeenLastCalledWith(
            TestBed.inject(GlobalService).pages.adminExcursionFormEdit(EXCURSION.id),
        );

        fixture.componentInstance.onNewExcursion();
        expect(navigate).toHaveBeenLastCalledWith(
            TestBed.inject(GlobalService).pages.adminExcursionForm,
        );
    });


    it('should delete an excursion after confirmation', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: EXCURSION })));
        const fixture = TestBed.createComponent(ExcursionsAdminPage);
        fixture.componentInstance.excursions = [EXCURSION];
        fixture.componentInstance.onActionDone(actionEvent(KzTableAction.REMOVE, EXCURSION.id));

        expect(fixture.componentInstance.dialogMessage).toContain('Medina walking tour');

        await fixture.componentInstance.onConfirmRemove();

        expect(fixture.componentInstance.excursions.length).toBe(0);
        expect(fixture.componentInstance.isDialogOpen).toBe(false);
    });
});
