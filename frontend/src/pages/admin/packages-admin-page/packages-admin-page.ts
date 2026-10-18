import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KzFormColumns } from '../../../models/kz_form_columns.enum';
import { DEFAULT_KZ_FORM_FIELD, KzFormField } from '../../../models/kz_form_field.interface';
import { KzFormFieldChange } from '../../../models/kz_form_field_change.interface';
import { KzFormSection } from '../../../models/kz_form_section.interface';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { KzPackage } from '../../../models/kz_package.interface';
import {
    DEFAULT_KZ_PACKAGE_FORM,
    DEFAULT_KZ_PACKAGE_FORM_ERRORS,
    KzPackageForm,
    KzPackageFormErrors,
} from '../../../models/kz_package_form.interface';
import { parseItem, parseList, parseResponse } from '../../../models/kz_response';
import {
    KzCellFormat,
    KzTableAction,
    KzTableActionEvent,
    KzTableColumn,
    KzTableRow,
} from '../../../models/kz_table.interface';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzBtn } from '../../../components/kz-btn/kz-btn';
import { KzDataTable } from '../../../components/kz-data-table/kz-data-table';
import { KzDialog } from '../../../components/kz-dialog/kz-dialog';
import { KzFilterBar } from '../../../components/kz-filter-bar/kz-filter-bar';
import { KzFormPanel } from '../../../components/kz-form-panel/kz-form-panel';


@Component({
    selector: 'kz-packages-admin-page',
    standalone: true,
    imports: [KzBtn, KzDataTable, KzDialog, KzFilterBar, KzFormPanel],
    templateUrl: './packages-admin-page.html',
    styleUrl: './packages-admin-page.css',
})
export class PackagesAdminPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Forfaits';
    readonly PAGE_SUBTITLE = 'Creez, modifiez et supprimez les forfaits du catalogue.';
    readonly SEARCH_LABEL = 'Recherche';
    readonly SEARCH_PLACEHOLDER = 'Nom, destination';
    readonly SEARCH_KEY = 'search';
    readonly NEW_LABEL = 'Nouveau forfait';
    readonly CLOSE_LABEL = 'Fermer le formulaire';
    readonly CREATE_TITLE = 'Nouveau forfait';
    readonly EDIT_TITLE = 'Modifier le forfait';
    readonly VALIDATION_LABEL = 'Corrigez les champs en erreur avant d enregistrer.';
    readonly ACTIVE_LABEL = 'Actif';
    readonly INACTIVE_LABEL = 'Inactif';
    readonly NAME_LABEL = 'Nom';
    readonly DESCRIPTION_LABEL = 'Description';
    readonly DESCRIPTION_ROWS = 4;
    readonly DESTINATION_LABEL = 'Destination';
    readonly DURATION_LABEL = 'Nuits';
    readonly PRICE_LABEL = 'Prix';
    readonly START_DATE_LABEL = 'Date de debut';
    readonly END_DATE_LABEL = 'Date de fin';
    readonly DISCOUNT_LABEL = 'Remise';
    readonly IMAGE_LABEL = 'Image';
    readonly DATES_COLUMN_LABEL = 'Dates';
    readonly NAME_ERROR = 'Le nom est obligatoire.';
    readonly DESTINATION_ERROR = 'La destination est obligatoire.';
    readonly DURATION_ERROR = 'Indiquez au moins une nuit.';
    readonly PRICE_ERROR = 'Le prix doit etre superieur a zero.';
    readonly DISCOUNT_ERROR = 'La remise doit etre comprise entre 0 et 100.';
    readonly DISCOUNT_MAX = '100';
    readonly NIGHTS_MIN = '1';
    readonly DISCOUNT_MIN = '0';
    readonly PRICE_MIN = '0';
    readonly PRICE_STEP = '0.01';
    readonly DATE_LENGTH = 10;
    readonly EMPTY_LABEL = KZ_LABELS.emptyList;
    readonly DIALOG_TITLE = 'Suppression';
    readonly REMOVE_QUESTION = 'Confirmer la suppression de ce forfait ?';
    readonly PRIMARY_KIND = KzBtnKind.PRIMARY;
    readonly ON_KIND = KzBtnKind.PRIMARY;
    readonly OFF_KIND = KzBtnKind.SECONDARY;
    readonly IDENTITY_SECTION = 'identity';
    readonly DATES_SECTION = 'dates';
    readonly TARIFF_SECTION = 'tariff';
    readonly MEDIA_SECTION = 'media';
    readonly DESCRIPTION_SECTION = 'description';
    readonly IDENTITY_TITLE = 'Forfait';
    readonly DATES_TITLE = 'Dates';
    readonly TARIFF_TITLE = 'Tarif';
    readonly MEDIA_TITLE = 'Image';

    readonly NAME_KEY = 'name';
    readonly DESTINATION_KEY = 'destination';
    readonly DATES_KEY = 'dates';
    readonly DURATION_KEY = 'duration';
    readonly PRICE_KEY = 'price';
    readonly DISCOUNT_KEY = 'discount';
    readonly ACTIVE_KEY = 'active';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly actions: KzTableAction[] = [KzTableAction.EDIT, KzTableAction.REMOVE];

    packages: KzPackage[] = [];
    rows: KzTableRow[] = [];
    form: KzPackageForm = { ...DEFAULT_KZ_PACKAGE_FORM };
    errors: KzPackageFormErrors = { ...DEFAULT_KZ_PACKAGE_FORM_ERRORS };
    removeTarget: KzPackage | null = null;
    search = '';
    editingId = 0;
    isFormOpen = false;
    isDirty = false;
    isLoading = true;
    isSaving = false;
    isDeleting = false;
    isDialogOpen = false;
    errorMessage = '';


    get filters(): KzFilterField[] {
        return [
            {
                name: this.SEARCH_KEY,
                label: this.SEARCH_LABEL,
                type: KzFieldType.TEXT,
                value: this.search,
                placeholder: this.SEARCH_PLACEHOLDER,
                options: [],
            },
        ];
    }


    get columns(): KzTableColumn[] {
        return [
            {
                key: this.NAME_KEY,
                label: this.NAME_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.DESTINATION_KEY,
                label: this.DESTINATION_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.DATES_KEY,
                label: this.DATES_COLUMN_LABEL,
                format: KzCellFormat.DATE,
            },
            {
                key: this.DURATION_KEY,
                label: this.DURATION_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                key: this.PRICE_KEY,
                label: this.PRICE_LABEL,
                format: KzCellFormat.PRICE,
            },
            {
                key: this.DISCOUNT_KEY,
                label: this.DISCOUNT_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                key: this.ACTIVE_KEY,
                label: this.ACTIVE_LABEL,
                format: KzCellFormat.BOOLEAN,
            },
        ];
    }


    get isEditing(): boolean {
        return this.editingId !== 0;
    }


    get formTitle(): string {
        return this.isEditing ? this.EDIT_TITLE : this.CREATE_TITLE;
    }


    get toggleFormLabel(): string {
        return this.isFormOpen ? this.CLOSE_LABEL : this.NEW_LABEL;
    }


    get activeLabel(): string {
        return this.form.active ? this.ACTIVE_LABEL : this.INACTIVE_LABEL;
    }


    get activeKind(): KzBtnKind {
        return this.form.active ? this.ON_KIND : this.OFF_KIND;
    }


    get hasFormErrors(): boolean {
        return Object.values(this.errors).some((message: string) => message.length > 0);
    }


    get validationMessage(): string {
        return this.hasFormErrors ? this.VALIDATION_LABEL : '';
    }


    get formSections(): KzFormSection[] {
        return [
            {
                id: this.IDENTITY_SECTION,
                title: this.IDENTITY_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'name',
                        label: this.NAME_LABEL,
                        value: this.form.name,
                        error: this.errors.name,
                        required: true,
                    }),
                    this.formField({
                        name: 'destination',
                        label: this.DESTINATION_LABEL,
                        value: this.form.destination,
                        error: this.errors.destination,
                        required: true,
                    }),
                ],
            },
            {
                id: this.DATES_SECTION,
                title: this.DATES_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'startDate',
                        label: this.START_DATE_LABEL,
                        type: KzFieldType.DATE,
                        value: this.form.startDate,
                    }),
                    this.formField({
                        name: 'endDate',
                        label: this.END_DATE_LABEL,
                        type: KzFieldType.DATE,
                        value: this.form.endDate,
                    }),
                ],
            },
            {
                id: this.TARIFF_SECTION,
                title: this.TARIFF_TITLE,
                columns: KzFormColumns.THREE,
                fields: [
                    this.formField({
                        name: 'durationNights',
                        label: this.DURATION_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.durationNights,
                        min: this.NIGHTS_MIN,
                        error: this.errors.durationNights,
                        required: true,
                    }),
                    this.formField({
                        name: 'price',
                        label: this.PRICE_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.price,
                        min: this.PRICE_MIN,
                        step: this.PRICE_STEP,
                        error: this.errors.price,
                        required: true,
                    }),
                    this.formField({
                        name: 'discountPercentage',
                        label: this.DISCOUNT_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.discountPercentage,
                        min: this.DISCOUNT_MIN,
                        max: this.DISCOUNT_MAX,
                        error: this.errors.discountPercentage,
                    }),
                ],
            },
            {
                id: this.MEDIA_SECTION,
                title: this.MEDIA_TITLE,
                columns: KzFormColumns.ONE,
                fields: [
                    this.formField({
                        name: 'imageUrl',
                        label: this.IMAGE_LABEL,
                        value: this.form.imageUrl,
                    }),
                ],
            },
            {
                id: this.DESCRIPTION_SECTION,
                columns: KzFormColumns.ONE,
                fields: [
                    this.formField({
                        name: 'description',
                        label: this.DESCRIPTION_LABEL,
                        type: KzFieldType.TEXTAREA,
                        value: this.form.description,
                        rows: this.DESCRIPTION_ROWS,
                    }),
                ],
            },
        ];
    }


    get dialogMessage(): string {
        if (this.removeTarget === null) {
            return '';
        }

        return `${this.REMOVE_QUESTION} (${this.removeTarget.name})`;
    }


    ngOnInit(): void {
        this.loadPackages();
    }


    hasUnsavedChanges(): boolean {
        return this.isFormOpen && this.isDirty;
    }


    onToggleForm(): void {
        if (this.isSaving) {
            return;
        }

        if (this.isFormOpen) {
            this.resetForm();

            return;
        }

        this.editingId = 0;
        this.form = { ...DEFAULT_KZ_PACKAGE_FORM };
        this.errors = { ...DEFAULT_KZ_PACKAGE_FORM_ERRORS };
        this.isFormOpen = true;
        this.isDirty = false;
    }


    onSearchChanged(values: Record<string, string>): void {
        this.applySearch(values[this.SEARCH_KEY] ?? '');
    }


    onSearchReset(): void {
        this.applySearch('');
    }


    onToggleActive(): void {
        this.form.active = !this.form.active;
        this.isDirty = true;
    }


    onFieldChange(change: KzFormFieldChange): void {
        this.form = { ...this.form, [change.name]: change.value } as KzPackageForm;
        this.errors = { ...this.errors, [change.name]: '' };
        this.isDirty = true;
    }

    async onSubmit(): Promise<void> {
        if (this.isSaving) {
            return;
        }

        this.errors = this.buildErrors();

        if (this.hasFormErrors) {
            return;
        }

        await this.save();
    }


    onActionDone(event: KzTableActionEvent): void {
        const target = this.packages.find((item) => item.id === event.rowId);

        if (target === undefined) {
            return;
        }

        if (event.action === KzTableAction.EDIT) {
            this.startEdit(target);

            return;
        }

        this.removeTarget = target;
        this.errorMessage = '';
        this.isDialogOpen = true;
    }


    onCloseDialog(): void {
        if (this.isDeleting) {
            return;
        }

        this.isDialogOpen = false;
        this.removeTarget = null;
    }


    async onConfirmRemove(): Promise<void> {
        if (this.removeTarget === null) {
            return;
        }

        await this.deletePackage(this.removeTarget);
    }


    async loadPackages(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.packages, {
                method: 'GET',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<unknown>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            this.setPackages(parseList<KzPackage>(parsed.data));
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isLoading = false;
        }
    }


    private async save(): Promise<void> {
        this.isSaving = true;
        this.errorMessage = '';

        try {
            const url = this.isEditing
                ? this.globalService.routes.package(this.editingId)
                : this.globalService.routes.packages;

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify(this.form),
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzPackage>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            const saved = parseItem<KzPackage>(parsed.data);

            if (saved === null) {
                this.errorMessage = KZ_LABELS.unexpectedError;

                return;
            }

            this.setPackages(this.replacePackage(saved));
            this.resetForm();
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isSaving = false;
        }
    }


    private async deletePackage(item: KzPackage): Promise<void> {
        this.isDeleting = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.package(item.id), {
                method: 'DELETE',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzPackage>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            this.setPackages(this.packages.filter((entry) => entry.id !== item.id));
            this.isDialogOpen = false;
            this.removeTarget = null;
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isDeleting = false;
        }
    }


    private startEdit(item: KzPackage): void {
        this.editingId = item.id;
        this.form = {
            name: item.name,
            description: item.description,
            destination: item.destination,
            durationNights: String(item.durationNights),
            price: String(item.price),
            startDate: item.startDate.slice(0, this.DATE_LENGTH),
            endDate: item.endDate.slice(0, this.DATE_LENGTH),
            discountPercentage: String(item.discountPercentage),
            imageUrl: item.imageUrl,
            active: item.available,
        };
        this.errors = { ...DEFAULT_KZ_PACKAGE_FORM_ERRORS };
        this.errorMessage = '';
        this.isFormOpen = true;
        this.isDirty = true;
    }


    private resetForm(): void {
        this.editingId = 0;
        this.form = { ...DEFAULT_KZ_PACKAGE_FORM };
        this.errors = { ...DEFAULT_KZ_PACKAGE_FORM_ERRORS };
        this.isFormOpen = false;
        this.isDirty = false;
    }


    private applySearch(value: string): void {
        this.search = value;
        this.rows = this.buildRows(this.filterPackages(this.packages));
    }


    private replacePackage(saved: KzPackage): KzPackage[] {
        const active = this.form.active;
        const entry: KzPackage = { ...saved, available: active };
        const exists = this.packages.some((item) => item.id === entry.id);

        return exists
            ? this.packages.map((item) => (item.id === entry.id ? entry : item))
            : [...this.packages, entry];
    }


    private setPackages(source: KzPackage[]): void {
        this.packages = source;
        this.rows = this.buildRows(this.filterPackages(source));
    }


    private filterPackages(source: readonly KzPackage[]): KzPackage[] {
        const search = this.search.trim().toLowerCase();

        if (search.length === 0) {
            return [...source];
        }

        return source.filter((item) =>
            item.name.toLowerCase().includes(search)
            || item.destination.toLowerCase().includes(search));
    }


    private buildRows(source: readonly KzPackage[]): KzTableRow[] {
        return source.map((item) => ({
            id: item.id,
            cells: {
                [this.NAME_KEY]: item.name,
                [this.DESTINATION_KEY]: item.destination,
                [this.DATES_KEY]: item.startDate,
                [this.DURATION_KEY]: item.durationNights,
                [this.PRICE_KEY]: item.price,
                [this.DISCOUNT_KEY]: item.discountPercentage,
                [this.ACTIVE_KEY]: item.available,
            },
        }));
    }


    private formField(field: Partial<KzFormField>): KzFormField {
        return { ...DEFAULT_KZ_FORM_FIELD, disabled: this.isSaving, ...field };
    }


    private buildErrors(): KzPackageFormErrors {
        const errors: KzPackageFormErrors = { ...DEFAULT_KZ_PACKAGE_FORM_ERRORS };
        const durationNights = Number(this.form.durationNights);
        const price = Number(this.form.price);
        const discount = Number(this.form.discountPercentage);

        if (this.form.name.trim().length === 0) {
            errors.name = this.NAME_ERROR;
        }

        if (this.form.destination.trim().length === 0) {
            errors.destination = this.DESTINATION_ERROR;
        }

        if (durationNights < 1) {
            errors.durationNights = this.DURATION_ERROR;
        }

        if (price <= 0) {
            errors.price = this.PRICE_ERROR;
        }

        if (discount < 0 || discount > Number(this.DISCOUNT_MAX)) {
            errors.discountPercentage = this.DISCOUNT_ERROR;
        }

        return errors;
    }
}