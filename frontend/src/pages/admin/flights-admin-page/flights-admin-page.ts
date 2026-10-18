import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { KzFlight } from '../../../models/kz_flight.interface';
import {
    DEFAULT_KZ_FLIGHT_FORM,
    DEFAULT_KZ_FLIGHT_FORM_ERRORS,
    KzFlightForm,
    KzFlightFormErrors,
} from '../../../models/kz_flight_form.interface';
import { KzFormColumns } from '../../../models/kz_form_columns.enum';
import { DEFAULT_KZ_FORM_FIELD, KzFormField } from '../../../models/kz_form_field.interface';
import { KzFormFieldChange } from '../../../models/kz_form_field_change.interface';
import { KzFormSection } from '../../../models/kz_form_section.interface';
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
import { KzFilterBar } from '../../../components/kz-filter-bar/kz-filter-bar';
import { KzFormPanel } from '../../../components/kz-form-panel/kz-form-panel';


@Component({
    selector: 'kz-flights-admin-page',
    standalone: true,
    imports: [KzBtn, KzDataTable, KzDialog, KzFilterBar, KzFormPanel],
    templateUrl: './flights-admin-page.html',
    styleUrl: './flights-admin-page.css',
})
export class FlightsAdminPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Vols';
    readonly PAGE_SUBTITLE = 'Creez, modifiez et supprimez les vols du catalogue.';
    readonly SEARCH_LABEL = 'Recherche';
    readonly SEARCH_PLACEHOLDER = 'Compagnie, numero, ville';
    readonly SEARCH_KEY = 'search';
    readonly NEW_LABEL = 'Nouveau vol';
    readonly CLOSE_LABEL = 'Fermer le formulaire';
    readonly CREATE_TITLE = 'Nouveau vol';
    readonly EDIT_TITLE = 'Modifier le vol';
    readonly VALIDATION_LABEL = 'Corrigez les champs en erreur avant d enregistrer.';
    readonly ACTIVE_LABEL = 'Actif';
    readonly INACTIVE_LABEL = 'Inactif';
    readonly AIRLINE_LABEL = 'Compagnie';
    readonly FLIGHT_NUMBER_LABEL = 'Numero';
    readonly DEPARTURE_CITY_LABEL = 'Ville de depart';
    readonly ARRIVAL_CITY_LABEL = 'Ville d arrivee';
    readonly DEPARTURE_TIME_LABEL = 'Date de depart';
    readonly ARRIVAL_TIME_LABEL = 'Date d arrivee';
    readonly TOTAL_SEATS_LABEL = 'Places totales';
    readonly AVAILABLE_SEATS_LABEL = 'Places disponibles';
    readonly PRICE_LABEL = 'Prix';
    readonly IMAGE_LABEL = 'Image';
    readonly ROUTE_LABEL = 'Depart';
    readonly DEPARTURE_COLUMN_LABEL = 'Depart le';
    readonly AVAILABLE_COLUMN_LABEL = 'Disponibles';
    readonly AIRLINE_ERROR = 'La compagnie est obligatoire.';
    readonly FLIGHT_NUMBER_ERROR = 'Le numero de vol est obligatoire.';
    readonly DEPARTURE_CITY_ERROR = 'La ville de depart est obligatoire.';
    readonly ARRIVAL_CITY_ERROR = 'La ville d arrivee est obligatoire.';
    readonly TOTAL_SEATS_ERROR = 'Indiquez au moins une place.';
    readonly AVAILABLE_SEATS_ERROR = 'Les places disponibles ne peuvent pas depasser le total.';
    readonly PRICE_ERROR = 'Le prix doit etre superieur a zero.';
    readonly SEATS_MIN = '1';
    readonly FREE_MIN = '0';
    readonly PRICE_MIN = '0';
    readonly PRICE_STEP = '0.01';
    readonly DATE_LENGTH = 10;
    readonly EMPTY_LABEL = KZ_LABELS.emptyList;
    readonly DIALOG_TITLE = 'Suppression';
    readonly REMOVE_QUESTION = 'Confirmer la suppression de ce vol ?';
    readonly PRIMARY_KIND = KzBtnKind.PRIMARY;
    readonly ON_KIND = KzBtnKind.PRIMARY;
    readonly OFF_KIND = KzBtnKind.SECONDARY;
    readonly IDENTITY_SECTION = 'identity';
    readonly ROUTE_SECTION = 'route';
    readonly TIMES_SECTION = 'times';
    readonly SEATS_SECTION = 'seats';
    readonly TARIFF_SECTION = 'tariff';
    readonly IDENTITY_TITLE = 'Compagnie';
    readonly ROUTE_TITLE = 'Trajet';
    readonly TIMES_TITLE = 'Horaires';
    readonly SEATS_TITLE = 'Places';
    readonly TARIFF_TITLE = 'Tarif';

    readonly NUMBER_KEY = 'number';
    readonly COMPANY_KEY = 'company';
    readonly ROUTE_KEY = 'route';
    readonly DEPARTURE_KEY = 'departure';
    readonly PRICE_KEY = 'price';
    readonly TOTAL_SEATS_KEY = 'totalSeats';
    readonly AVAILABLE_SEATS_KEY = 'availableSeats';
    readonly ACTIVE_KEY = 'active';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly actions: KzTableAction[] = [KzTableAction.EDIT, KzTableAction.REMOVE];

    flights: KzFlight[] = [];
    rows: KzTableRow[] = [];
    form: KzFlightForm = { ...DEFAULT_KZ_FLIGHT_FORM };
    errors: KzFlightFormErrors = { ...DEFAULT_KZ_FLIGHT_FORM_ERRORS };
    removeTarget: KzFlight | null = null;
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
                key: this.NUMBER_KEY,
                label: this.FLIGHT_NUMBER_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.COMPANY_KEY,
                label: this.AIRLINE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.ROUTE_KEY,
                label: this.ROUTE_LABEL,
                format: KzCellFormat.TEXT,
            },
            {
                key: this.DEPARTURE_KEY,
                label: this.DEPARTURE_COLUMN_LABEL,
                format: KzCellFormat.DATE,
            },
            {
                key: this.PRICE_KEY,
                label: this.PRICE_LABEL,
                format: KzCellFormat.PRICE,
            },
            {
                key: this.TOTAL_SEATS_KEY,
                label: this.TOTAL_SEATS_LABEL,
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
                        name: 'airline',
                        label: this.AIRLINE_LABEL,
                        value: this.form.airline,
                        error: this.errors.airline,
                        required: true,
                    }),
                    this.formField({
                        name: 'flightNumber',
                        label: this.FLIGHT_NUMBER_LABEL,
                        value: this.form.flightNumber,
                        error: this.errors.flightNumber,
                        required: true,
                    }),
                ],
            },
            {
                id: this.ROUTE_SECTION,
                title: this.ROUTE_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'departureCity',
                        label: this.DEPARTURE_CITY_LABEL,
                        value: this.form.departureCity,
                        error: this.errors.departureCity,
                        required: true,
                    }),
                    this.formField({
                        name: 'arrivalCity',
                        label: this.ARRIVAL_CITY_LABEL,
                        value: this.form.arrivalCity,
                        error: this.errors.arrivalCity,
                        required: true,
                    }),
                ],
            },
            {
                id: this.TIMES_SECTION,
                title: this.TIMES_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'departureTime',
                        label: this.DEPARTURE_TIME_LABEL,
                        type: KzFieldType.DATE,
                        value: this.form.departureTime,
                    }),
                    this.formField({
                        name: 'arrivalTime',
                        label: this.ARRIVAL_TIME_LABEL,
                        type: KzFieldType.DATE,
                        value: this.form.arrivalTime,
                    }),
                ],
            },
            {
                id: this.SEATS_SECTION,
                title: this.SEATS_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
                    this.formField({
                        name: 'totalSeats',
                        label: this.TOTAL_SEATS_LABEL,
                        type: KzFieldType.NUMBER,
                        value: this.form.totalSeats,
                        min: this.SEATS_MIN,
                        error: this.errors.totalSeats,
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
                ],
            },
            {
                id: this.TARIFF_SECTION,
                title: this.TARIFF_TITLE,
                columns: KzFormColumns.TWO,
                fields: [
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
                        name: 'imageUrl',
                        label: this.IMAGE_LABEL,
                        value: this.form.imageUrl,
                    }),
                ],
            },
        ];
    }


    get dialogMessage(): string {
        if (this.removeTarget === null) {
            return '';
        }

        return `${this.REMOVE_QUESTION} (${this.removeTarget.flightNumber})`;
    }


    ngOnInit(): void {
        this.loadFlights();
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
        this.form = { ...DEFAULT_KZ_FLIGHT_FORM };
        this.errors = { ...DEFAULT_KZ_FLIGHT_FORM_ERRORS };
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
        this.form = { ...this.form, [change.name]: change.value } as KzFlightForm;
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
        const target = this.flights.find((flight) => flight.id === event.rowId);

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

        await this.deleteFlight(this.removeTarget);
    }


    async loadFlights(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.flights, {
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

            this.setFlights(parseList<KzFlight>(parsed.data));
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
                ? this.globalService.routes.flight(this.editingId)
                : this.globalService.routes.flights;

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify(this.form),
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzFlight>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            const saved = parseItem<KzFlight>(parsed.data);

            if (saved === null) {
                this.errorMessage = KZ_LABELS.unexpectedError;

                return;
            }

            this.setFlights(this.replaceFlight(saved));
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


    private async deleteFlight(flight: KzFlight): Promise<void> {
        this.isDeleting = true;
        this.errorMessage = '';

        try {
            const response = await fetch(this.globalService.routes.flight(flight.id), {
                method: 'DELETE',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzFlight>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            this.setFlights(this.flights.filter((item) => item.id !== flight.id));
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


    private startEdit(flight: KzFlight): void {
        this.editingId = flight.id;
        this.form = {
            airline: flight.airline,
            flightNumber: flight.flightNumber,
            departureCity: flight.departureCity,
            arrivalCity: flight.arrivalCity,
            departureTime: flight.departureTime.slice(0, this.DATE_LENGTH),
            arrivalTime: flight.arrivalTime.slice(0, this.DATE_LENGTH),
            totalSeats: String(flight.totalSeats),
            availableSeats: String(flight.availableSeats),
            price: String(flight.price),
            imageUrl: flight.imageUrl,
            active: flight.active,
        };
        this.errors = { ...DEFAULT_KZ_FLIGHT_FORM_ERRORS };
        this.errorMessage = '';
        this.isFormOpen = true;
        this.isDirty = true;
    }


    private resetForm(): void {
        this.editingId = 0;
        this.form = { ...DEFAULT_KZ_FLIGHT_FORM };
        this.errors = { ...DEFAULT_KZ_FLIGHT_FORM_ERRORS };
        this.isFormOpen = false;
        this.isDirty = false;
    }


    private applySearch(value: string): void {
        this.search = value;
        this.rows = this.buildRows(this.filterFlights(this.flights));
    }


    private replaceFlight(saved: KzFlight): KzFlight[] {
        const exists = this.flights.some((flight) => flight.id === saved.id);

        return exists
            ? this.flights.map((flight) => (flight.id === saved.id ? saved : flight))
            : [...this.flights, saved];
    }


    private setFlights(source: KzFlight[]): void {
        this.flights = source;
        this.rows = this.buildRows(this.filterFlights(source));
    }


    private filterFlights(source: readonly KzFlight[]): KzFlight[] {
        const search = this.search.trim().toLowerCase();

        if (search.length === 0) {
            return [...source];
        }

        return source.filter((flight) =>
            flight.airline.toLowerCase().includes(search)
            || flight.flightNumber.toLowerCase().includes(search)
            || flight.departureCity.toLowerCase().includes(search)
            || flight.arrivalCity.toLowerCase().includes(search));
    }


    private buildRows(source: readonly KzFlight[]): KzTableRow[] {
        return source.map((flight) => ({
            id: flight.id,
            cells: {
                [this.NUMBER_KEY]: flight.flightNumber,
                [this.COMPANY_KEY]: flight.airline,
                [this.ROUTE_KEY]: `${flight.departureCity} - ${flight.arrivalCity}`,
                [this.DEPARTURE_KEY]: flight.departureTime,
                [this.PRICE_KEY]: flight.price,
                [this.TOTAL_SEATS_KEY]: flight.totalSeats,
                [this.AVAILABLE_SEATS_KEY]: flight.availableSeats,
                [this.ACTIVE_KEY]: flight.active,
            },
        }));
    }


    private formField(field: Partial<KzFormField>): KzFormField {
        return { ...DEFAULT_KZ_FORM_FIELD, disabled: this.isSaving, ...field };
    }


    private buildErrors(): KzFlightFormErrors {
        const errors: KzFlightFormErrors = { ...DEFAULT_KZ_FLIGHT_FORM_ERRORS };
        const totalSeats = Number(this.form.totalSeats);
        const availableSeats = Number(this.form.availableSeats);
        const price = Number(this.form.price);

        if (this.form.airline.trim().length === 0) {
            errors.airline = this.AIRLINE_ERROR;
        }

        if (this.form.flightNumber.trim().length === 0) {
            errors.flightNumber = this.FLIGHT_NUMBER_ERROR;
        }

        if (this.form.departureCity.trim().length === 0) {
            errors.departureCity = this.DEPARTURE_CITY_ERROR;
        }

        if (this.form.arrivalCity.trim().length === 0) {
            errors.arrivalCity = this.ARRIVAL_CITY_ERROR;
        }

        if (totalSeats < 1) {
            errors.totalSeats = this.TOTAL_SEATS_ERROR;
        }

        if (availableSeats < 0 || availableSeats > totalSeats) {
            errors.availableSeats = this.AVAILABLE_SEATS_ERROR;
        }

        if (price <= 0) {
            errors.price = this.PRICE_ERROR;
        }

        return errors;
    }
}