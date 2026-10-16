import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KzIconImage } from '../../models/kz_icon_image.interface';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzIconRef } from '../../models/kz_icon_ref.interface';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KzTone } from '../../models/kz_tone.enum';
import { parseResponse } from '../../models/kz_response';
import { AuthService } from '../../services/auth.service';
import { GlobalService } from '../../services/global.service';
import { KzBtn } from '../kz-btn/kz-btn';
import { KzIcon } from '../kz-icon/kz-icon';
import { KzNavLink } from './kz-header_nav_link.interface';


@Component({
    selector: 'kz-header',
    standalone: true,
    imports: [KzBtn, KzIcon, RouterLink, RouterLinkActive],
    templateUrl: './kz-header.html',
    styleUrl: './kz-header.css',
})
export class KzHeader {
    readonly BRAND_ICON_SIZE = KzIconSize.MD;
    readonly BRAND_ICON_TONE = KzTone.DARK;
    readonly MENU_ICON_TONE = KzTone.DARK;
    readonly GHOST_KIND = KzBtnKind.GHOST;
    readonly SECONDARY_KIND = KzBtnKind.SECONDARY;
    readonly LOGOUT_ICON: KzIconRef = {
        name: KzIconName.LOGOUT,
        size: KzIconSize.SM,
        tone: KzTone.DARK,
    };
    readonly SIGN_IN_LABEL = 'Connexion';
    readonly SIGN_UP_LABEL = 'Inscription';
    readonly SIGN_OUT_LABEL = 'Deconnexion';
    readonly SIGN_OUT_LOADING_LABEL = 'Deconnexion...';
    readonly HOME_LABEL = 'Accueil';
    readonly PACKAGES_LABEL = 'Forfaits';
    readonly FLIGHTS_LABEL = 'Vols';
    readonly EXCURSIONS_LABEL = 'Excursions';
    readonly RESERVATIONS_LABEL = 'Mes reservations';
    readonly DASHBOARD_LABEL = 'Tableau de bord';
    readonly ADMIN_FLIGHTS_LABEL = 'Admin vols';
    readonly ADMIN_PACKAGES_LABEL = 'Admin forfaits';
    readonly ADMIN_EXCURSIONS_LABEL = 'Admin excursions';
    readonly ADMIN_RESERVATIONS_LABEL = 'Admin reservations';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly navLinks: KzNavLink[] = [
        {
            label: this.HOME_LABEL,
            path: this.globalService.pages.home,
            icon: KzIconName.LOGO,
            exact: true,
        },
        {
            label: this.PACKAGES_LABEL,
            path: this.globalService.pages.packages,
            icon: KzIconName.SUITCASE,
            exact: false,
        },
        {
            label: this.FLIGHTS_LABEL,
            path: this.globalService.pages.flights,
            icon: KzIconName.PLANE,
            exact: false,
        },
        {
            label: this.EXCURSIONS_LABEL,
            path: this.globalService.pages.excursions,
            icon: KzIconName.COMPASS,
            exact: false,
        },
        {
            label: this.RESERVATIONS_LABEL,
            path: this.globalService.pages.reservations,
            icon: KzIconName.RECEIPT,
            exact: false,
        },
    ];

    readonly adminLinks: KzNavLink[] = [
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
            exact: false,
        },
        {
            label: this.ADMIN_PACKAGES_LABEL,
            path: this.globalService.pages.adminPackages,
            icon: KzIconName.SUITCASE,
            exact: false,
        },
        {
            label: this.ADMIN_EXCURSIONS_LABEL,
            path: this.globalService.pages.adminExcursions,
            icon: KzIconName.COMPASS,
            exact: false,
        },
        {
            label: this.ADMIN_RESERVATIONS_LABEL,
            path: this.globalService.pages.adminReservations,
            icon: KzIconName.RECEIPT,
            exact: false,
        },
    ];

    isMenuOpen = false;
    isSigningOut = false;


    get appName(): string {
        return this.globalService.APP_NAME;
    }


    get homePath(): string {
        return this.globalService.pages.home;
    }


    get signInPath(): string {
        return this.globalService.pages.signIn;
    }


    get signUpPath(): string {
        return this.globalService.pages.signUp;
    }


    get brandIcon(): KzIconImage {
        return this.globalService.iconImage(KzIconName.LOGO, this.appName);
    }


    get brandIconSize(): KzIconSize {
        return this.BRAND_ICON_SIZE;
    }


    get brandIconTone(): KzTone {
        return this.BRAND_ICON_TONE;
    }


    get menuIcon(): KzIconImage {
        return this.globalService.iconImage(this.isMenuOpen ? KzIconName.CLOSE : KzIconName.MENU, 'Menu');
    }


    get menuIconTone(): KzTone {
        return this.MENU_ICON_TONE;
    }


    get isSignedIn(): boolean {
        return this.authService.isSignedIn;
    }


    get isAdmin(): boolean {
        return this.authService.isAdmin;
    }


    get userName(): string {
        return this.authService.user.name;
    }


    get signOutLabel(): string {
        return this.isSigningOut ? this.SIGN_OUT_LOADING_LABEL : this.SIGN_OUT_LABEL;
    }


    toggleMenu(): void {
        this.isMenuOpen = !this.isMenuOpen;
    }


    closeMenu(): void {
        this.isMenuOpen = false;
    }


    goTo(page: string): void {
        this.closeMenu();
        this.router.navigateByUrl(page);
    }


    async signOut(): Promise<void> {
        if (this.isSigningOut) {
            return;
        }

        this.isSigningOut = true;

        try {
            const response = await fetch(this.globalService.routes.logout, {
                method: 'POST',
                credentials: 'include',
                headers: this.authService.authHeaders,
            });
            const raw: unknown = await response.json();
            console.log(raw);
            console.log(parseResponse<null>(raw, response.status));
        }
        catch (error: unknown) {
            console.error(error);
        }
        finally {
            this.isSigningOut = false;
            this.authService.clearSession();
            this.closeMenu();
            this.router.navigateByUrl(this.globalService.pages.signIn);
        }
    }
}
