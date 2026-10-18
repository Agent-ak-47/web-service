import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { KZ_LABELS } from '../../models/kz_labels.interface';
import { GlobalService } from '../../services/global.service';
import { KzBtn } from '../../components/kz-btn/kz-btn';


@Component({
    selector: 'kz-not-found-page',
    standalone: true,
    imports: [KzBtn, RouterLink],
    templateUrl: './not-found-page.html',
    styleUrl: './not-found-page.css',
})
export class NotFoundPage {
    readonly CODE = '404';
    readonly TITLE = 'Page not found';
    readonly SUBTITLE = 'The requested page does not exist or has been moved.';
    readonly BACK_LABEL = KZ_LABELS.back;

    private readonly globalService = inject(GlobalService);
    private readonly router = inject(Router);


    get homePath(): string {
        return this.globalService.pages.home;
    }


    goHome(): void {
        this.router.navigateByUrl(this.homePath);
    }
}
