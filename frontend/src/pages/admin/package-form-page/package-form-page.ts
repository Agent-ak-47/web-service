import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { KzBreadcrumbItem } from '../../../models/kz_breadcrumb_item.interface';
import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzFieldType } from '../../../models/kz_field_type.enum';
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
import { parseResponse } from '../../../models/kz_response';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { ItemDetailService } from '../../../services/item-detail.service';
import { KzBreadcrumb } from '../../../components/kz-breadcrumb/kz-breadcrumb';
import { KzFormPanel } from '../../../components/kz-form-panel/kz-form-panel';
import { KzLoading } from '../../../components/kz-loading/kz-loading';


@Component({
    selector: 'kz-package-form-page',
    standalone: true,
    imports: [KzBreadcrumb, KzFormPanel, KzLoading],
    templateUrl: './package-form-page.html',
    styleUrl: './package-form-page.css',
})
export class PackageFormPage implements KzGuardedForm, OnInit {
    readonly PAGE_SUBTITLE = 'Creez ou modifiez un forfait du catalogue.';
    readonly ADMIN_LABEL = 'Forfaits';
    readonly CREATE_TITLE = 'Nouveau forfait';
    readonly EDIT_TITLE = 'Modifier le forfait';
    readonly VALIDATION_LABEL = 'Corrigez les champs en erreur avant d enregistrer.';
    readonly LOADING_LABEL = KZ_LABELS.loading;
    readonly ACTIVE_LABEL = 'Actif';
    readonly INACTIVE_LABEL = 'Inactif';
    readonly IDENTITY_SECTION = 'identity';
    readonly DATES_SECTION = 'dates';
    readonly TARIFF_SECTION = 'tariff';
    readonly MEDIA_SECTION = 'media';
    readonly DESCRIPTION_SECTION = 'description';
    readonly IDENTITY_TITLE = 'Forfait';
    readonly DATES_TITLE = 'Dates';
    readonly TARIFF_TITLE = 'Tarif';
    readonly MEDIA_TITLE = 'Image';
    readonly NAME_LABEL = 'Nom';
    readonly DESTINATION_LABEL = 'Destination';
    readonly START_DATE_LABEL = 'Date de debut';
    readonly END_DATE_LABEL = 'Date de fin';
    readonly DURATION_LABEL = 'Nuits';
    readonly PRICE_LABEL = 'Prix';
    readonly DISCOUNT_LABEL = 'Remise';
    readonly IMAGE_LABEL = 'Image';
    readonly DESCRIPTION_LABEL = 'Description';
    readonly DESCRIPTION_ROWS = 4;
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
    readonly ON_KIND = KzBtnKind.PRIMARY;
    readonly OFF_KIND = KzBtnKind.SECONDARY;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly detailService = inject(ItemDetailService);

    form: KzPackageForm = { ...DEFAULT_KZ_PACKAGE_FORM };
    errors: KzPackageFormErrors = { ...DEFAULT_KZ_PACKAGE_FORM_ERRORS };
    editingId = 0;
    isLoading = true;
    isSaving = false;
    isDirty = false;
    errorMessage = '';


    get isEditing(): boolean {
        return this.editingId !== 0;
    }


    get formTitle(): string {
        return this.isEditing ? this.EDIT_TITLE : this.CREATE_TITLE;
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


    get breadcrumb(): KzBreadcrumbItem[] {
        return [
            { label: this.ADMIN_LABEL, path: this.globalService.pages.adminPackages },
            { label: this.formTitle, path: '' },
        ];
    }


    get sections(): KzFormSection[] {
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


    ngOnInit(): void {
        this.load();
    }


    hasUnsavedChanges(): boolean {
        return this.isDirty;
    }


    onFieldChange(change: KzFormFieldChange): void {
        this.form = { ...this.form, [change.name]: change.value } as KzPackageForm;
        this.errors = { ...this.errors, [change.name]: '' };
        this.isDirty = true;
    }


    onToggleActive(): void {
        this.form.active = !this.form.active;
        this.isDirty = true;
    }


    onCancel(): void {
        this.router.navigateByUrl(this.globalService.pages.adminPackages);
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


    private async load(): Promise<void> {
        const id = Number(this.route.snapshot.paramMap.get('id') ?? '0');

        if (id === 0) {
            this.isLoading = false;

            return;
        }

        const result = await this.detailService.load<KzPackage>(this.globalService.routes.package(id));

        if (result.signedOut) {
            this.router.navigateByUrl(this.globalService.pages.signIn);

            return;
        }

        if (result.item === null) {
            this.errorMessage = result.error.length > 0 ? result.error : KZ_LABELS.noResult;
            this.isLoading = false;

            return;
        }

        this.startEdit(result.item);
        this.isLoading = false;
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

            this.isDirty = false;
            this.router.navigateByUrl(this.globalService.pages.adminPackages);
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isSaving = false;
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
        this.isDirty = false;
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