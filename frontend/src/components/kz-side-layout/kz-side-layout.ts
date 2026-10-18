import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { KzIcon } from '../kz-icon/kz-icon';
import { KzBtn } from '../kz-btn/kz-btn';
import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KzIconImage } from '../../models/kz_icon_image.interface';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzIconRef } from '../../models/kz_icon_ref.interface';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KzNavLink } from '../../models/kz_nav_link.interface';
import { KzTone } from '../../models/kz_tone.enum';
import { GlobalService } from '../../services/global.service';
import { SessionService } from '../../services/session.service';


@Component({
    selector: 'kz-side-layout',
    standalone: true,
    imports: [KzBtn, KzIcon, RouterLink, RouterLinkActive, RouterOutlet],
    templateUrl: './kz-side-layout.html',
    styleUrl: './kz-side-layout.css',
})
export class KzSideLayout {
    readonly ICON_SIZE = KzIconSize.SM;
    readonly ICON_TONE = KzTone.NEUTRAL;
    readonly LOGOUT_KIND = KzBtnKind.GHOST;
    readonly LOGOUT_ICON: KzIconRef = {
        name: KzIconName.LOGOUT,
        size: KzIconSize.SM,
        tone: KzTone.DARK,
    };

    readonly title = input<string>('');
    readonly hint = input<string>('');
    readonly links = input<KzNavLink[]>([]);
    readonly logoutLabel = input<string>('');

    isSigningOut = false;

    private readonly globalService = inject(GlobalService);
    private readonly sessionService = inject(SessionService);


    get hasLogout(): boolean {
        return this.logoutLabel().length > 0;
    }


    iconImage(link: KzNavLink): KzIconImage {
        return this.globalService.iconImage(link.icon, '');
    }


    async onLogout(): Promise<void> {
        if (this.isSigningOut) {
            return;
        }

        this.isSigningOut = true;

        try {
            await this.sessionService.logout();
        }
        finally {
            this.isSigningOut = false;
        }
    }
}