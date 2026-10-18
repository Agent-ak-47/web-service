import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { KzNavLink } from '../../../components/kz-header/kz-header_nav_link.interface';
import { KzIcon } from '../../../components/kz-icon/kz-icon';
import { KzIconImage } from '../../../models/kz_icon_image.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzIconSize } from '../../../models/kz_icon_size.enum';
import { KzTone } from '../../../models/kz_tone.enum';
import { GlobalService } from '../../../services/global.service';


@Component({
    selector: 'kz-admin-layout',
    standalone: true,
    imports: [KzIcon, RouterLink, RouterLinkActive, RouterOutlet],
    templateUrl: './admin-layout.html',
    styleUrl: './admin-layout.css',
})
export class AdminLayout {
    readonly ICON_SIZE = KzIconSize.SM;
    readonly ICON_TONE = KzTone.NEUTRAL;
    readonly MENU_TITLE = 'Administration';
    readonly MENU_HINT = 'Gestion des catalogues et des reservations.';
    readonly DASHBOARD_LABEL = 'Tableau de bord';
    readonly ADMIN_FLIGHTS_LABEL = 'Vols';
    readonly ADMIN_PACKAGES_LABEL = 'Forfaits';
    readonly ADMIN_EXCURSIONS_LABEL = 'Excursions';
    readonly ADMIN_RESERVATIONS_LABEL = 'Reservations';

    private readonly globalService = inject(GlobalService);

    readonly links: KzNavLink[] = [
        {
            label: this.DASHBOARD_LABEL,
            path: this.globalService.pages.adminDashboard,
            icon: KzIconName.STAR,
            exact: true,
        },
        {
            label: this.ADMIN_FLIGHTS_LABEL,
            path: this.globalService.pages.adminFlights,
            icon: KzIconName.PLANE,
            exact: true,
        },
        {
            label: this.ADMIN_PACKAGES_LABEL,
            path: this.globalService.pages.adminPackages,
            icon: KzIconName.SUITCASE,
            exact: true,
        },
        {
            label: this.ADMIN_EXCURSIONS_LABEL,
            path: this.globalService.pages.adminExcursions,
            icon: KzIconName.COMPASS,
            exact: true,
        },
        {
            label: this.ADMIN_RESERVATIONS_LABEL,
            path: this.globalService.pages.adminReservations,
            icon: KzIconName.RECEIPT,
            exact: true,
        },
    ];


    iconImage(link: KzNavLink): KzIconImage {
        return this.globalService.iconImage(link.icon, '');
    }
}