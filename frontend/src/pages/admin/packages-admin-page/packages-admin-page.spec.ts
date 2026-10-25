import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_KZ_PACKAGE, KzPackage } from '../../../models/kz_package.interface';
import { KzTableAction, KzTableActionEvent } from '../../../models/kz_table.interface';
import { GlobalService } from '../../../services/global.service';
import { PackagesAdminPage } from './packages-admin-page';


const PACKAGE: KzPackage = {
    ...DEFAULT_KZ_PACKAGE,
    id: 2,
    name: 'Marrakech Escape',
    destination: 'Marrakech',
    startDate: '2026-12-01',
    durationNights: 4,
    price: 2000,
    discountPercentage: 25,
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


function actionEvent(action: KzTableAction, rowId: number): KzTableActionEvent {
    return { action, rowId };
}


describe('PackagesAdminPage', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PackagesAdminPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should load the packages into the table', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [PACKAGE] })));
        const fixture = TestBed.createComponent(PackagesAdminPage);

        await fixture.componentInstance.loadPackages();

        expect(fixture.componentInstance.packages.length).toBe(1);
        expect(fixture.componentInstance.rows[0].cells['name']).toBe('Marrakech Escape');
        expect(fixture.componentInstance.rows[0].cells['discount']).toBe(25);
    });


    it('should filter the packages and reset the search', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [PACKAGE] })));
        const fixture = TestBed.createComponent(PackagesAdminPage);
        await fixture.componentInstance.loadPackages();

        fixture.componentInstance.onSearchChanged({ search: 'marrakech' });
        expect(fixture.componentInstance.rows.length).toBe(1);

        fixture.componentInstance.onSearchChanged({ search: 'agadir' });
        expect(fixture.componentInstance.rows.length).toBe(0);

        fixture.componentInstance.onSearchReset();
        expect(fixture.componentInstance.rows.length).toBe(1);
    });


    it('should navigate to the edit and create forms', () => {
        const fixture = TestBed.createComponent(PackagesAdminPage);
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
        fixture.componentInstance.packages = [PACKAGE];

        fixture.componentInstance.onActionDone(actionEvent(KzTableAction.EDIT, PACKAGE.id));
        expect(navigate).toHaveBeenLastCalledWith(
            TestBed.inject(GlobalService).pages.adminPackageFormEdit(PACKAGE.id),
        );

        fixture.componentInstance.onNewPackage();
        expect(navigate).toHaveBeenLastCalledWith(
            TestBed.inject(GlobalService).pages.adminPackageForm,
        );
    });


    it('should delete a package after confirmation', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: PACKAGE })));
        const fixture = TestBed.createComponent(PackagesAdminPage);
        fixture.componentInstance.packages = [PACKAGE];
        fixture.componentInstance.onActionDone(actionEvent(KzTableAction.REMOVE, PACKAGE.id));

        expect(fixture.componentInstance.dialogMessage).toContain('Marrakech Escape');

        await fixture.componentInstance.onConfirmRemove();

        expect(fixture.componentInstance.packages.length).toBe(0);
        expect(fixture.componentInstance.isDialogOpen).toBe(false);
    });
});
