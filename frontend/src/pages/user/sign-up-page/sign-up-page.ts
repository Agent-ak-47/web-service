import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { KzAuthSession } from '../../../models/kz_auth_session.interface';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzGuardedForm } from '../../../models/kz_guarded_form.interface';
import { KZ_LABELS } from '../../../models/kz_labels.interface';
import { parseItem, parseResponse } from '../../../models/kz_response';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { KzBtn } from '../../../components/kz-btn/kz-btn';
import { KzField } from '../../../components/kz-field/kz-field';
import { DEFAULT_KZ_REGISTER_FORM, KzRegisterForm } from './models/kz_register_form.interface';


@Component({
    selector: 'kz-sign-up-page',
    standalone: true,
    imports: [KzBtn, KzField, RouterLink],
    templateUrl: './sign-up-page.html',
    styleUrl: './sign-up-page.css',
})
export class SignUpPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Inscription';
    readonly PAGE_SUBTITLE = 'Creez votre compte pour reserver et payer en quelques clics.';
    readonly EMAIL_LABEL = 'Email';
    readonly PASSWORD_LABEL = 'Mot de passe';
    readonly CONFIRM_LABEL = 'Confirmer le mot de passe';
    readonly EMAIL_ERROR = 'Saisissez une adresse email valide.';
    readonly PASSWORD_ERROR = 'Le mot de passe doit contenir au moins 8 caracteres.';
    readonly CONFIRM_ERROR = 'Les mots de passe ne correspondent pas.';
    readonly DUPLICATE_MESSAGE = 'Cet email est deja utilise.';
    readonly SUBMIT_LABEL = 'Creer mon compte';
    readonly SUBMIT_LOADING_LABEL = KZ_LABELS.saving;
    readonly SECURITY_HINT = 'Votre mot de passe est envoye directement a l API, il n est jamais stocke dans le navigateur.';
    readonly PROFILE_HINT = 'Vous pourrez completer votre nom, telephone et adresse dans votre profil.';
    readonly SIGN_IN_PROMPT = 'Deja inscrit ?';
    readonly SIGN_IN_LABEL = 'Se connecter';
    readonly MIN_PASSWORD_LENGTH = 8;
    readonly EMAIL_AT = '@';
    readonly DUPLICATE_CODE = 'DUPLICATE';
    readonly DUPLICATE_STATUS = 409;
    readonly EMAIL_TYPE = KzFieldType.EMAIL;
    readonly PASSWORD_TYPE = KzFieldType.PASSWORD;

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    form: KzRegisterForm = { ...DEFAULT_KZ_REGISTER_FORM };
    isSending = false;
    errorMessage = '';
    emailError = '';
    passwordError = '';
    confirmPasswordError = '';


    get signInPath(): string {
        return this.globalService.pages.signIn;
    }


    get submitLabel(): string {
        return this.isSending ? this.SUBMIT_LOADING_LABEL : this.SUBMIT_LABEL;
    }


    ngOnInit(): void {
        if (this.authService.isSignedIn) {
            this.router.navigateByUrl(this.globalService.pages.home);
        }
    }


    hasUnsavedChanges(): boolean {
        return this.form.email.length > 0
            || this.form.password.length > 0
            || this.form.confirmPassword.length > 0;
    }


    onEmailChange(value: string): void {
        this.form.email = value;
        this.emailError = '';
    }


    onPasswordChange(value: string): void {
        this.form.password = value;
        this.passwordError = '';
    }


    onConfirmPasswordChange(value: string): void {
        this.form.confirmPassword = value;
        this.confirmPasswordError = '';
    }


    async onSubmit(): Promise<void> {
        if (this.isSending) {
            return;
        }

        this.errorMessage = '';

        if (!this.validate()) {
            return;
        }

        await this.send();
    }


    private validate(): boolean {
        this.emailError = this.isEmailValid() ? '' : this.EMAIL_ERROR;
        this.passwordError = this.form.password.length < this.MIN_PASSWORD_LENGTH ? this.PASSWORD_ERROR : '';
        this.confirmPasswordError = this.form.confirmPassword !== this.form.password ? this.CONFIRM_ERROR : '';

        return this.emailError.length === 0
            && this.passwordError.length === 0
            && this.confirmPasswordError.length === 0;
    }


    private isEmailValid(): boolean {
        const email = this.form.email.trim();

        return email.includes(this.EMAIL_AT) && !email.startsWith(this.EMAIL_AT);
    }


    private async send(): Promise<void> {
        this.isSending = true;

        try {
            const response = await fetch(this.globalService.routes.register, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
                body: JSON.stringify({
                    email: this.form.email.trim(),
                    password: this.form.password,
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
                this.errorMessage = this.isDuplicate(response.status, parsed.error.code)
                    ? this.DUPLICATE_MESSAGE
                    : parsed.error.message;

                return;
            }

            const session = parseItem<KzAuthSession>(parsed.data);

            if (session === null) {
                this.errorMessage = KZ_LABELS.unexpectedError;

                return;
            }

            this.authService.saveSession(session);
            this.form = { ...DEFAULT_KZ_REGISTER_FORM };
            this.router.navigateByUrl(this.globalService.pages.profile);
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
        }
        finally {
            this.isSending = false;
        }
    }


    private isDuplicate(status: number, code: string): boolean {
        return status === this.DUPLICATE_STATUS || code === this.DUPLICATE_CODE;
    }
}