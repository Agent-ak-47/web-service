import { Component, inject } from '@angular/core';

import { KzNavLink } from '../../../models/kz_nav_link.interface';
import { KzIconName } from '../../../models/kz_icon_name.enum';
import { GlobalService } from '../../../services/global.service';
import { KzSideLayout } from '../../../components/kz-side-layout/kz-side-layout';


@Component({
    selector: 'kz-admin-layout',
    standalone: true,
    imports: [KzSideLayout],
    templateUrl: './admin-layout.html',
    styleUrl: './admin-layout.css',
})
export class AdminLayout {
    readonly MENU_TITLE = 'Administration';
    readonly MENU_HINT = 'Gestion des catalogues et des reservations.';
    readonly DASHBOARD_LABEL = 'Tableau de bord';
    readonly ADMIN_FLIGHTS_LABEL = 'Vols';
    readonly ADMIN_PACKAGES_LABEL = 'Forfaits';
    readonly ADMIN_EXCURSIONS_LABEL = 'Excursions';
    readonly ADMIN_RESERVATIONS_LABEL = 'Reservations';
    readonly LOGOUT_LABEL = 'Deconnexion';

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
}