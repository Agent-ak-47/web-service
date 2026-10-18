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
import { DEFAULT_KZ_CREDENTIALS_FORM, KzCredentialsForm } from './models/kz_credentials_form.interface';


@Component({
    selector: 'kz-sign-in-page',
    standalone: true,
    imports: [KzBtn, KzField, RouterLink],
    templateUrl: './sign-in-page.html',
    styleUrl: './sign-in-page.css',
})
export class SignInPage implements KzGuardedForm, OnInit {
    readonly PAGE_TITLE = 'Sign in';
    readonly PAGE_SUBTITLE = 'Sign in to see your bookings and your payments.';
    readonly EMAIL_LABEL = 'Email';
    readonly PASSWORD_LABEL = 'Password';
    readonly SUBMIT_LABEL = 'Sign in';
    readonly SUBMIT_LOADING_LABEL = KZ_LABELS.sending;
    readonly SECURITY_HINT = 'Your credentials are sent to the API and are not stored in the browser.';
    readonly UNAVAILABLE_CODE = 'SERVICE_UNAVAILABLE';
    readonly UNAVAILABLE_STATUS = 502;
    readonly UNAVAILABLE_HINT = "The API is unreachable. Check that the backend is running then retry.";
    readonly SIGN_UP_PROMPT = 'No account yet?';
    readonly SIGN_UP_LABEL = 'Create an account';
    readonly EMAIL_TYPE = KzFieldType.EMAIL;
    readonly PASSWORD_TYPE = KzFieldType.PASSWORD;
    readonly DEMO_EMAIL = 'client@agency.travel';
    readonly DEMO_PASSWORD = 'Password123!';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    form: KzCredentialsForm = { ...DEFAULT_KZ_CREDENTIALS_FORM };
    isSending = false;
    isDirty = false;
    errorMessage = '';
    unavailableMessage = '';


    get signUpPath(): string {
        return this.globalService.pages.signUp;
    }


    get submitLabel(): string {
        return this.isSending ? this.SUBMIT_LOADING_LABEL : this.SUBMIT_LABEL;
    }


    ngOnInit(): void {
        if (this.authService.isSignedIn) {
            this.router.navigateByUrl(this.globalService.pages.home);

            return;
        }

        this.autofillDemo();
    }


    hasUnsavedChanges(): boolean {
        return this.isDirty;
    }


    onEmailChange(value: string): void {
        this.form.email = value;
        this.isDirty = true;
    }


    onPasswordChange(value: string): void {
        this.form.password = value;
        this.isDirty = true;
    }


    async onSubmit(): Promise<void> {
        if (this.isSending) {
            return;
        }

        this.errorMessage = '';
        this.unavailableMessage = '';

        const rememberedPage = this.authService.lastPage;

        await this.send(rememberedPage);
    }


    private async send(rememberedPage: string): Promise<void> {
        this.isSending = true;

        try {
            const response = await fetch(this.globalService.routes.login, {
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
                this.errorMessage = parsed.error.message;

                if (this.isUnavailable(response.status, parsed.error.code)) {
                    this.unavailableMessage = this.UNAVAILABLE_HINT;
                }

                return;
            }

            const session = parseItem<KzAuthSession>(parsed.data);

            if (session === null) {
                this.errorMessage = KZ_LABELS.unexpectedError;

                return;
            }

            this.authService.saveSession(session);
            this.authService.clearLastPage();
            this.form = { ...DEFAULT_KZ_CREDENTIALS_FORM };
            this.isDirty = false;
            this.router.navigateByUrl(this.landingPath(rememberedPage));
        }
        catch (error: unknown) {
            console.error(error);
            this.errorMessage = KZ_LABELS.unexpectedError;
            this.unavailableMessage = this.UNAVAILABLE_HINT;
        }
        finally {
            this.isSending = false;
        }
    }


    private landingPath(rememberedPage: string): string {
        if (this.authService.isAdmin) {
            return this.globalService.pages.adminDashboard;
        }

        return rememberedPage.length > 0 ? rememberedPage : this.globalService.pages.home;
    }


    private autofillDemo(): void {
        if (!this.globalService.MOCK_MODE) {
            return;
        }

        this.form = { email: this.DEMO_EMAIL, password: this.DEMO_PASSWORD };
    }


    private isUnavailable(status: number, code: string): boolean {
        return status === this.UNAVAILABLE_STATUS || code === this.UNAVAILABLE_CODE;
    }
}