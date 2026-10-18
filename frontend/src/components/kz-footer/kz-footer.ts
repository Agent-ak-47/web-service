import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GlobalService } from '../../services/global.service';
import { KzFooterLink } from './kz-footer_link.interface';


@Component({
    selector: 'kz-footer',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './kz-footer.html',
    styleUrl: './kz-footer.css',
})
export class KzFooter {
    readonly PRODUCT_TITLE = 'Products';
    readonly COMPANY_TITLE = 'Agency';
    readonly CONTACT_TITLE = 'Contact';
    readonly RIGHTS_LABEL = 'All rights reserved.';

    private readonly globalService = inject(GlobalService);

    readonly productLinks: KzFooterLink[] = [
        { label: 'Packages', path: this.globalService.pages.packages },
        { label: 'Flights', path: this.globalService.pages.flights },
        { label: 'Excursions', path: this.globalService.pages.excursions },
    ];

    readonly companyLinks: KzFooterLink[] = [
        { label: 'My bookings', path: this.globalService.pages.reservations },
        { label: 'Sign in', path: this.globalService.pages.signIn },
        { label: 'Sign up', path: this.globalService.pages.signUp },
    ];


    get appName(): string {
        return this.globalService.APP_NAME;
    }


    get tagline(): string {
        return this.globalService.TAGLINE;
    }


    get supportEmail(): string {
        return this.globalService.supportEmail;
    }


    get supportPhone(): string {
        return this.globalService.supportPhone;
    }


    get currentYear(): string {
        return String(new Date().getFullYear());
    }
}
