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
    readonly PRODUCT_TITLE = 'Produits';
    readonly COMPANY_TITLE = 'Agence';
    readonly CONTACT_TITLE = 'Contact';
    readonly RIGHTS_LABEL = 'Tous droits reserves.';

    private readonly globalService = inject(GlobalService);

    readonly productLinks: KzFooterLink[] = [
        { label: 'Forfaits', path: this.globalService.pages.packages },
        { label: 'Vols', path: this.globalService.pages.flights },
        { label: 'Excursions', path: this.globalService.pages.excursions },
    ];

    readonly companyLinks: KzFooterLink[] = [
        { label: 'Mes reservations', path: this.globalService.pages.reservations },
        { label: 'Connexion', path: this.globalService.pages.signIn },
        { label: 'Inscription', path: this.globalService.pages.signUp },
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
