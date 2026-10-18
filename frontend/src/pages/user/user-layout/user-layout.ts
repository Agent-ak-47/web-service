import { Component, inject } from '@angular/core';

import { KzIconName } from '../../../models/kz_icon_name.enum';
import { KzNavLink } from '../../../models/kz_nav_link.interface';
import { GlobalService } from '../../../services/global.service';
import { KzSideLayout } from '../../../components/kz-side-layout/kz-side-layout';


@Component({
    selector: 'kz-user-layout',
    standalone: true,
    imports: [KzSideLayout],
    templateUrl: './user-layout.html',
    styleUrl: './user-layout.css',
})
export class UserLayout {
    readonly MENU_TITLE = 'My account';
    readonly MENU_HINT = 'Your details and your bookings.';
    readonly PROFILE_LABEL = 'Personal information';
    readonly RESERVATIONS_LABEL = 'My bookings';
    readonly LOGOUT_LABEL = 'Log out';

    private readonly globalService = inject(GlobalService);

    readonly links: KzNavLink[] = [
        {
            label: this.PROFILE_LABEL,
            path: this.globalService.pages.profile,
            icon: KzIconName.USER,
            exact: true,
        },
        {
            label: this.RESERVATIONS_LABEL,
            path: this.globalService.pages.reservations,
            icon: KzIconName.RECEIPT,
            exact: true,
        },
    ];
}