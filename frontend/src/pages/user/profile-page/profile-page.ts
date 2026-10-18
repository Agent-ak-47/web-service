import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { KzAuthSession } from '../../../models/kz_auth_session.interface';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { parseItem, parseResponse } from '../../../models/kz_response';
import { KzUser } from '../../../models/kz_user.interface';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzBtn } from '../../../components/kz-btn/kz-btn';
import { KzField } from '../../../components/kz-field/kz-field';
import { KzLoading } from '../../../components/kz-loading/kz-loading';
import { DEFAULT_KZ_PROFILE_FORM, KzProfileForm } from './models/kz_profile_form.interface';


@Component({
    selector: 'kz-profile-page',
    standalone: true,
    imports: [KzBtn, KzField, KzLoading],
    templateUrl: './profile-page.html',
    styleUrl: './profile-page.css',
})
export class ProfilePage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Personal information';
    readonly PAGE_SUBTITLE = 'Keep your details up to date for your bookings.';
    readonly NAME_LABEL = 'Full name';
    readonly EMAIL_LABEL = 'Email';
    readonly EMAIL_READONLY_HINT = 'The email cannot be changed.';
    readonly PHONE_LABEL = 'Phone';
    readonly ADDRESS_LABEL = 'Address';
    readonly NAME_ERROR = 'The name is required.';
    readonly SAVE_LABEL = 'Save';
    readonly SAVED_LABEL = 'Saved';
    readonly SAVING_LABEL = KZ_LABELS.saving;
    readonly LOADING_LABEL = KZ_LABELS.loading;
    readonly ADDRESS_ROWS = 3;
    readonly TEXT_TYPE = KzFieldType.TEXT;
    readonly EMAIL_TYPE = KzFieldType.EMAIL;
    readonly TEXTAREA_TYPE = KzFieldType.TEXTAREA;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    form: KzProfileForm = { ...DEFAULT_KZ_PROFILE_FORM };
    user: KzUser | null = null;
    isLoading = true;
    isSaving = false;
    isSaved = false;
    nameError = '';
    errorMessage = '';


    get saveLabel(): string {
        if (this.isSaving) {
            return this.SAVING_LABEL;
        }

        return this.isSaved ? this.SAVED_LABEL : this.SAVE_LABEL;
    }


    ngOnInit(): void {
        this.fill();
    }


    hasUnsavedChanges(): boolean {
        return this.user !== null
            && (this.form.name !== this.user.name
                || this.form.phone !== this.user.phone
                || this.form.address !== this.user.address);
    }


    onNameChange(value: string): void {
        this.form.name = value;
        this.nameError = '';
        this.isSaved = false;
    }


    onPhoneChange(value: string): void {
        this.form.phone = value;
        this.isSaved = false;
    }


    onAddressChange(value: string): void {
        this.form.address = value;
        this.isSaved = false;
    }


    async onSubmit(): Promise<void> {
        if (this.isSaving) {
            return;
        }

        this.errorMessage = '';
        this.nameError = this.form.name.trim().length === 0 ? this.NAME_ERROR : '';

        if (this.nameError.length > 0) {
            return;
        }

        await this.save();
    }


    private fill(): void {
        this.user = this.authService.user;
        this.form = {
            name: this.user.name,
            email: this.user.email,
            phone: this.user.phone,
            address: this.user.address,
        };
        this.isLoading = false;
    }


    private async save(): Promise<void> {
        this.isSaving = true;
        this.isSaved = false;

        try {
            const response = await fetch(this.globalService.routes.me, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify({
                    name: this.form.name.trim(),
                    phone: this.form.phone.trim(),
                    address: this.form.address.trim(),
                }),
            });
            const raw: unknown = await response.json();
            console.log(raw);

            const parsed = parseResponse<KzAuthSession>(raw, response.status);

            if (parsed.redirect.length > 0) {
                this.authService.clearSession();
                this.router.navigateByUrl(parsed.redirect);

                return;
            }

            if (parsed.error !== null) {
                this.errorMessage = parsed.error.message;

                return;
            }

            const session = parseItem<KzAuthSession>(parsed.data);

            if (session === null) {
                this.errorMessage = KZ_LABELS.unexpectedError;

                return;
            }

            this.authService.saveSession(session);
            this.user = session.user;
            this.form = {
                name: session.user.name,
                email: session.user.email,
                phone: session.user.phone,
                address: session.user.address,
            };
            this.isSaved = true;
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isSaving = false;
        }
    }
}