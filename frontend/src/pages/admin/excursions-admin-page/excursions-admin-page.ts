import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzExcursion } from '../../../models/kz_excursion.interface';
import {
    DEFAULT_KZ_EXCURSION_FORM,
    DEFAULT_KZ_EXCURSION_FORM_ERRORS,
    KzExcursionForm,
    KzExcursionFormErrors,
} from '../../../models/kz_excursion_form.interface';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
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
import { KzField } from '../../../components/kz-field/kz-field';
import { KzFilterBar } from '../../../components/kz-filter-bar/kz-filter-bar';


@Component({
    selector: 'kz-excursions-admin-page',
    standalone: true,
    imports: [KzBtn, KzDataTable, KzDialog, KzField, KzFilterBar],
    templateUrl: './excursions-admin-page.html',
    styleUrl: './excursions-admin-page.css',
})
export class ExcursionsAdminPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Excursions';
    readonly PAGE_SUBTITLE = 'Creez, modifiez et supprimez les excursions du catalogue.';
    readonly SEARCH_LABEL = 'Recherche';
    readonly SEARCH_PLACEHOLDER = 'Titre, lieu, guide';
    readonly SEARCH_KEY = 'search';
    readonly NEW_LABEL = 'Nouvelle excursion';
    readonly CLOSE_LABEL = 'Fermer le formulaire';
    readonly CREATE_TITLE = 'Nouvelle excursion';
    readonly EDIT_TITLE = 'Modifier l excursion';
    readonly SAVE_LABEL = 'Enregistrer';
    readonly CANCEL_LABEL = KZ_LABELS.cancel;
    readonly VALIDATION_LABEL = 'Corrigez les champs en erreur avant d enregistrer.';
    readonly ACTIVE_LABEL = 'Actif';
    readonly INACTIVE_LABEL = 'Inactif';
    readonly TITLE_LABEL = 'Titre';
    readonly LOCATION_LABEL = 'Lieu';
    readonly DESCRIPTION_LABEL = 'Description';
    readonly DESCRIPTION_ROWS = 4;
    readonly DATE_LABEL = 'Date';
    readonly START_TIME_LABEL = 'Heure de depart';
    readonly DURATION_LABEL = 'Duree';
    readonly DURATION_UNIT = 'minutes';
    readonly CAPACITY_LABEL = 'Places totales';
    readonly AVAILABLE_SEATS_LABEL = 'Places disponibles';
    readonly PRICE_LABEL = 'Prix';
    readonly GUIDE_LABEL = 'Guide';
    readonly IMAGE_LABEL = 'Image';
    readonly AVAILABLE_COLUMN_LABEL = 'Disponibles';
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
    readonly EMPTY_LABEL = KZ_LABELS.emptyList;
    readonly DIALOG_TITLE = 'Suppression';
    readonly REMOVE_QUESTION = 'Confirmer la suppression de cette excursion ?';
    readonly TEXT_TYPE = KzFieldType.TEXT;
    readonly TEXTAREA_TYPE = KzFieldType.TEXTAREA;
    readonly NUMBER_TYPE = KzFieldType.NUMBER;
    readonly DATE_TYPE = KzFieldType.DATE;
    readonly TIME_TYPE = KzFieldType.TIME;
    readonly PRIMARY_KIND = KzBtnKind.PRIMARY;
    readonly SECONDARY_KIND = KzBtnKind.SECONDARY;
    readonly ON_KIND = KzBtnKind.PRIMARY;
    readonly OFF_KIND = KzBtnKind.SECONDARY;

    readonly TITLE_KEY = 'title';
    readonly LOCATION_KEY = 'location';
    readonly DATE_KEY = 'date';
    readonly DURATION_KEY = 'duration';
    readonly GUIDE_KEY = 'guide';
    readonly PRICE_KEY = 'price';
    readonly CAPACITY_KEY = 'capacity';
    readonly AVAILABLE_SEATS_KEY = 'availableSeats';
    readonly ACTIVE_KEY = 'active';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly actions: KzTableAction[] = [KzTableAction.EDIT, KzTableAction.REMOVE];

    excursions: KzExcursion[] = [];
    rows: KzTableRow[] = [];
    form: KzExcursionForm = { ...DEFAULT_KZ_EXCURSION_FORM };
    errors: KzExcursionFormErrors = { ...DEFAULT_KZ_EXCURSION_FORM_ERRORS };
    removeTarget: KzExcursion | null = null;
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
                key: this.TITLE_KEY,
                label: this.TITLE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.LOCATION_KEY,
                label: this.LOCATION_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.DATE_KEY,
                label: this.DATE_LABEL,
                format: KzCellFormat.DATE,
            },
            {
                key: this.DURATION_KEY,
                label: this.DURATION_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                key: this.GUIDE_KEY,
                label: this.GUIDE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.PRICE_KEY,
                label: this.PRICE_LABEL,
                format: KzCellFormat.PRICE,
            },
            {
                key: this.CAPACITY_KEY,
                label: this.CAPACITY_LABEL,
                format: KzCellFormat.NUMBER,
            },
            {
                key: this.AVAILABLE_SEATS_KEY,
                label: this.AVAILABLE_COLUMN_LABEL,
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


    get dialogMessage(): string {
        if (this.removeTarget === null) {
            return '';
        }

        return `${this.REMOVE_QUESTION} (${this.removeTarget.title})`;
    }


    ngOnInit(): void {
        this.loadExcursions();
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
        this.form = { ...DEFAULT_KZ_EXCURSION_FORM };
        this.errors = { ...DEFAULT_KZ_EXCURSION_FORM_ERRORS };
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


    onTitleChange(value: string): void {
        this.form.title = value;
        this.errors.title = '';
        this.isDirty = true;
    }


    onLocationChange(value: string): void {
        this.form.location = value;
        this.errors.location = '';
        this.isDirty = true;
    }


    onDescriptionChange(value: string): void {
        this.form.description = value;
        this.isDirty = true;
    }


    onDateChange(value: string): void {
        this.form.date = value;
        this.isDirty = true;
    }


    onStartTimeChange(value: string): void {
        this.form.startTime = value;
        this.isDirty = true;
    }


    onDurationChange(value: string): void {
        this.form.dureeMinutes = value;
        this.errors.dureeMinutes = '';
        this.isDirty = true;
    }


    onCapacityChange(value: string): void {
        this.form.capacity = value;
        this.errors.capacity = '';
        this.isDirty = true;
    }


    onAvailableSeatsChange(value: string): void {
        this.form.availableSeats = value;
        this.errors.availableSeats = '';
        this.isDirty = true;
    }


    onPriceChange(value: string): void {
        this.form.price = value;
        this.errors.price = '';
        this.isDirty = true;
    }


    onGuideChange(value: string): void {
        this.form.guide = value;
        this.isDirty = true;
    }


    onImageChange(value: string): void {
        this.form.imageUrl = value;
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
        const target = this.excursions.find((item) => item.id === event.rowId);

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

        await this.deleteExcursion(this.removeTarget);
    }


    async loadExcursions(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.excursions, {
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

            this.setExcursions(parseList<KzExcursion>(parsed.data));
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

            const saved = parseItem<KzExcursion>(parsed.data);

            if (saved === null) {
                this.errorMessage = KZ_LABELS.unexpectedError;

                return;
            }

            this.setExcursions(this.replaceExcursion(saved));
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


    private async deleteExcursion(item: KzExcursion): Promise<void> {
        this.isDeleting = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.excursion(item.id), {
                method: 'DELETE',
                credentials: 'include',
                headers: this.authService.authHeaders,
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

            this.setExcursions(this.excursions.filter((entry) => entry.id !== item.id));
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
        this.errorMessage = '';
        this.isFormOpen = true;
        this.isDirty = true;
    }


    private resetForm(): void {
        this.editingId = 0;
        this.form = { ...DEFAULT_KZ_EXCURSION_FORM };
        this.errors = { ...DEFAULT_KZ_EXCURSION_FORM_ERRORS };
        this.isFormOpen = false;
        this.isDirty = false;
    }


    private applySearch(value: string): void {
        this.search = value;
        this.rows = this.buildRows(this.filterExcursions(this.excursions));
    }


    private replaceExcursion(saved: KzExcursion): KzExcursion[] {
        const active = this.form.active;
        const entry: KzExcursion = { ...saved, available: active };
        const exists = this.excursions.some((item) => item.id === entry.id);

        return exists
            ? this.excursions.map((item) => (item.id === entry.id ? entry : item))
            : [...this.excursions, entry];
    }


    private setExcursions(source: KzExcursion[]): void {
        this.excursions = source;
        this.rows = this.buildRows(this.filterExcursions(source));
    }


    private filterExcursions(source: readonly KzExcursion[]): KzExcursion[] {
        const search = this.search.trim().toLowerCase();

        if (search.length === 0) {
            return [...source];
        }

        return source.filter((item) =>
            item.title.toLowerCase().includes(search)
            || item.location.toLowerCase().includes(search)
            || item.guide.toLowerCase().includes(search));
    }


    private buildRows(source: readonly KzExcursion[]): KzTableRow[] {
        return source.map((item) => ({
            id: item.id,
            cells: {
                [this.TITLE_KEY]: item.title,
                [this.LOCATION_KEY]: item.location,
                [this.DATE_KEY]: item.date,
                [this.DURATION_KEY]: item.dureeMinutes,
                [this.GUIDE_KEY]: item.guide,
                [this.PRICE_KEY]: item.price,
                [this.CAPACITY_KEY]: item.capacity,
                [this.AVAILABLE_SEATS_KEY]: item.availableSeats,
                [this.ACTIVE_KEY]: item.available,
            },
        }));
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