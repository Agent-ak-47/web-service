import { ChangeDetectorRef, Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KzAvatarVariant } from '../../models/kz_avatar_variant.enum';
import { KzIconImage } from '../../models/kz_icon_image.interface';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KzTone } from '../../models/kz_tone.enum';
import { AuthService } from '../../services/auth.service';
import { GlobalService } from '../../services/global.service';
import { KzAvatar } from '../kz-avatar/kz-avatar';
import { KzBtn } from '../kz-btn/kz-btn';
import { KzIcon } from '../kz-icon/kz-icon';
import { KzNavLink } from '../../models/kz_nav_link.interface';


@Component({
    selector: 'kz-header',
    standalone: true,
    imports: [KzAvatar, KzBtn, KzIcon, RouterLink, RouterLinkActive],
    templateUrl: './kz-header.html',
    styleUrl: './kz-header.css',
})
export class KzHeader {
    readonly BRAND_ICON_SIZE = KzIconSize.MD;
    readonly BRAND_ICON_TONE = KzTone.DARK;
    readonly MENU_ICON_TONE = KzTone.DARK;
    readonly GHOST_KIND = KzBtnKind.GHOST;
    readonly SECONDARY_KIND = KzBtnKind.SECONDARY;
    readonly SIGN_IN_LABEL = 'Sign in';
    readonly SIGN_UP_LABEL = 'Sign up';
    readonly PACKAGES_LABEL = 'Packages';
    readonly FLIGHTS_LABEL = 'Flights';
    readonly EXCURSIONS_LABEL = 'Excursions';
    readonly PROFILE_LINK_LABEL = 'My profile';
    readonly ADMIN_LINK_LABEL = 'Admin area';
    readonly AVATAR_EMPTY_INITIAL = '?';

    private readonly globalService = inject(GlobalService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly changeDetector = inject(ChangeDetectorRef);

    readonly navLinks: KzNavLink[] = [
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
    ];

    isMenuOpen = false;


    @HostListener('window:storage', ['$event'])
    onStorage(event: StorageEvent): void {
        if (event.key === this.authService.TOKEN_KEY || event.key === this.authService.USER_KEY) {
            this.changeDetector.detectChanges();
        }
    }


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


get userEmail(): string {
        return this.authService.user.email;
    }


    get profilePath(): string {
        return this.globalService.pages.profile;
    }


    get avatarPath(): string {
        return this.authService.isAdmin ? this.globalService.pages.adminDashboard : this.profilePath;
    }


    get avatarLinkLabel(): string {
        return this.authService.isAdmin ? this.ADMIN_LINK_LABEL : this.PROFILE_LINK_LABEL;
    }


    get avatarInitial(): string {
        const email = this.authService.user.email.trim();

        return email.length > 0 ? email.charAt(0).toUpperCase() : this.AVATAR_EMPTY_INITIAL;
    }


    get avatarVariant(): KzAvatarVariant {
        return this.authService.isAdmin ? KzAvatarVariant.GOLD : KzAvatarVariant.DEFAULT;
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
}
