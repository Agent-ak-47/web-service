import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzExcursion } from '../../../models/kz_excursion.interface';
import {
    DEFAULT_KZ_EXCURSION_FORM,
    DEFAULT_KZ_EXCURSION_FORM_ERRORS,
    KzExcursionForm,
    KzExcursionFormErrors,
} from '../../../models/kz_excursion_form.interface';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFormColumns } from '../../../models/kz_form_columns.enum';
import { DEFAULT_KZ_FORM_FIELD, KzFormField } from '../../../models/kz_form_field.interface';
import { KzFormFieldChange } from '../../../models/kz_form_field_change.interface';
import { KzFormSection } from '../../../models/kz_form_section.interface';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { parseResponse } from '../../../models/kz_response';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { ItemDetailService } from '../../../services/item-detail.service';
import { KzFormPanel } from '../../../components/kz-form-panel/kz-form-panel';
import { KzLoading } from '../../../components/kz-loading/kz-loading';


@Component({
    selector: 'kz-excursion-form-page',
    standalone: true,
    imports: [KzFormPanel, KzLoading],
    templateUrl: './excursion-form-page.html',
    styleUrl: './excursion-form-page.css',
})
export class ExcursionFormPage implements KzGuardedForm, OnInit {
    readonly PAGE_SUBTITLE = 'Creez ou modifiez une excursion du catalogue.';
    readonly CREATE_TITLE = 'Nouvelle excursion';
    readonly EDIT_TITLE = 'Modifier l excursion';
    readonly VALIDATION_LABEL = 'Corrigez les champs en erreur avant d enregistrer.';
    readonly LOADING_LABEL = KZ_LABELS.loading;
    readonly ACTIVE_LABEL = 'Actif';
    readonly INACTIVE_LABEL = 'Inactif';
    readonly IDENTITY_SECTION = 'identity';
    readonly WHEN_SECTION = 'when';
    readonly SEATS_SECTION = 'seats';
    readonly GUIDE_SECTION = 'guide';
    readonly DESCRIPTION_SECTION = 'description';
    readonly IDENTITY_TITLE = 'Excursion';
    readonly WHEN_TITLE = 'Quand';
    readonly SEATS_TITLE = 'Places et tarif';
    readonly GUIDE_TITLE = 'Guide et image';
    readonly TITLE_LABEL = 'Titre';
    readonly LOCATION_LABEL = 'Lieu';
    readonly DATE_LABEL = 'Date';
    readonly START_TIME_LABEL = 'Heure de depart';
    readonly DURATION_LABEL = 'Duree';
    readonly DURATION_UNIT = 'minutes';
    readonly CAPACITY_LABEL = 'Places totales';
    readonly AVAILABLE_SEATS_LABEL = 'Places disponibles';
    readonly PRICE_LABEL = 'Prix';
    readonly GUIDE_LABEL = 'Guide';
    readonly IMAGE_LABEL = 'Image';
    readonly DESCRIPTION_LABEL = 'Description';
    readonly DESCRIPTION_ROWS = 4;
    readonly TITLE_ERROR = 'Le titre est obligatoire.';
    readonly LOCATION_ERROR = 'Le lieu est obligatoire.';
    readonly DURATION_ERROR = 'La duree doit etre superieure a zero.';
    readonly CAPACITY_ERROR = 'Indiquez au moins une place.';
    readonly AVAILABLE_SEATS_ERROR = 'Les places disponibles ne peuvent pas depasser le total.';
    readonly PRICE_ERROR = 'Le prix doit etre superieur a zero.';
    readonly SEATS_MIN = '1';
    readonly FREE_MIN = '0';
    readonly PRICE_MIN = '0';
    readonly PRICE_STEP = '0.01';
    readonly DURATION_MIN = '1';
    readonly DATE_LENGTH = 10;
    readonly ON_KIND = KzBtnKind.PRIMARY;
    readonly OFF_KIND = KzBtnKind.SECONDARY;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly detailService = inject(ItemDetailService);

    form: KzExcursionForm = { ...DEFAULT_KZ_EXCURSION_FORM };
    errors: KzExcursionFormErrors = { ...DEFAULT_KZ_EXCURSION_FORM_ERRORS };
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


    get sections(): KzFormSection[] {
        return [
            {
                id: this.IDENTITY_SECTION,
                title: this.IDENTITY_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'title',
                        label: this.TITLE_LABEL,
                        value: this.form.title,
                        error: this.errors.title,
                        required: true,
                    }),
                    this.formField({
                        name: 'location',
                        label: this.LOCATION_LABEL,
                        value: this.form.location,
                        error: this.errors.location,
                        required: true,
                    }),
                ],
            },
            {
                id: this.WHEN_SECTION,
                title: this.WHEN_TITLE,
                columns: KzFormColumns.THREE,
                fields: [
                    this.formField({
                        name: 'date',
                        label: this.DATE_LABEL,
                        type: KzFieldType.DATE,
                        value: this.form.date,
                    }),
                    this.formField({
                        name: 'startTime',
                        label: this.START_TIME_LABEL,
                        type: KzFieldType.TIME,
                        value: this.form.startTime,
                    }),
                    this.formField({
                        name: 'dureeMinutes',
                        label: this.DURATION_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.dureeMinutes,
                        hint: this.DURATION_UNIT,
                        min: this.DURATION_MIN,
                        error: this.errors.dureeMinutes,
                        required: true,
                    }),
                ],
            },
            {
                id: this.SEATS_SECTION,
                title: this.SEATS_TITLE,
                columns: KzFormColumns.THREE,
                fields: [
                    this.formField({
                        name: 'capacity',
                        label: this.CAPACITY_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.capacity,
                        min: this.SEATS_MIN,
                        error: this.errors.capacity,
                        required: true,
                    }),
                    this.formField({
                        name: 'availableSeats',
                        label: this.AVAILABLE_SEATS_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.availableSeats,
                        min: this.FREE_MIN,
                        error: this.errors.availableSeats,
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
                ],
            },
            {
                id: this.GUIDE_SECTION,
                title: this.GUIDE_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'guide',
                        label: this.GUIDE_LABEL,
                        value: this.form.guide,
                    }),
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
        this.form = { ...this.form, [change.name]: change.value } as KzExcursionForm;
        this.errors = { ...this.errors, [change.name]: '' };
        this.isDirty = true;
    }


    onToggleActive(): void {
        this.form.active = !this.form.active;
        this.isDirty = true;
    }


    onCancel(): void {
        this.router.navigateByUrl(this.globalService.pages.adminExcursions);
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

        if (id !== 0) {
            const result = await this.detailService.load<KzExcursion>(this.globalService.routes.excursion(id));

            if (result.signedOut) {
                this.router.navigateByUrl(this.globalService.pages.signIn);

                return;
            }

            if (result.item === null) {
                this.errorMessage = result.error.length > 0 ? result.error : KZ_LABELS.noResult;
            }
            else {
                this.startEdit(result.item);
            }
        }

        this.isLoading = false;
    }


    private async save(): Promise<void> {
        this.isSaving = true;
        this.errorMessage = '';

        try {
            const url = this.isEditing
                ? this.globalService.routes.excursion(this.editingId)
                : this.globalService.routes.excursions;

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify(this.form),
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzExcursion>(raw, response.status);

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
            this.router.navigateByUrl(this.globalService.pages.adminExcursions);
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isSaving = false;
        }
    }


    private startEdit(item: KzExcursion): void {
        this.editingId = item.id;
        this.form = {
            title: item.title,
            location: item.location,
            description: item.description,
            date: item.date.slice(0, this.DATE_LENGTH),
            startTime: item.startTime,
            dureeMinutes: String(item.dureeMinutes),
            capacity: String(item.capacity),
            availableSeats: String(item.availableSeats),
            price: String(item.price),
            imageUrl: item.imageUrl,
            guide: item.guide,
            active: item.available,
        };
        this.errors = { ...DEFAULT_KZ_EXCURSION_FORM_ERRORS };
        this.isDirty = false;
    }


    private formField(field: Partial<KzFormField>): KzFormField {
        return { ...DEFAULT_KZ_FORM_FIELD, disabled: this.isSaving, ...field };
    }


    private buildErrors(): KzExcursionFormErrors {
        const errors: KzExcursionFormErrors = { ...DEFAULT_KZ_EXCURSION_FORM_ERRORS };
        const duration = Number(this.form.dureeMinutes);
        const capacity = Number(this.form.capacity);
        const availableSeats = Number(this.form.availableSeats);
        const price = Number(this.form.price);

        if (this.form.title.trim().length === 0) {
            errors.title = this.TITLE_ERROR;
        }

        if (this.form.location.trim().length === 0) {
            errors.location = this.LOCATION_ERROR;
        }

        if (duration < 1) {
            errors.dureeMinutes = this.DURATION_ERROR;
        }

        if (capacity < 1) {
            errors.capacity = this.CAPACITY_ERROR;
        }

        if (availableSeats < 0 || availableSeats > capacity) {
            errors.availableSeats = this.AVAILABLE_SEATS_ERROR;
        }

        if (price <= 0) {
            errors.price = this.PRICE_ERROR;
        }

        return errors;
    }
}
