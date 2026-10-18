import { Component, inject, input, output } from '@angular/core';

import { DEFAULT_KZ_BTN_KIND, KzBtnKind } from '../../models/kz_btn_kind.enum';
import { DEFAULT_KZ_BTN_TYPE, KzBtnType } from '../../models/kz_btn_type.enum';
import { KzIconImage } from '../../models/kz_icon_image.interface';
import { DEFAULT_KZ_ICON_REF, KzIconRef } from '../../models/kz_icon_ref.interface';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KzTone } from '../../models/kz_tone.enum';
import { GlobalService } from '../../services/global.service';
import { KzIcon } from '../kz-icon/kz-icon';


@Component({
    selector: 'kz-btn',
    standalone: true,
    imports: [KzIcon],
    templateUrl: './kz-btn.html',
    styleUrl: './kz-btn.css',
})
export class KzBtn {
    readonly SPINNER_CLASS = 'kz-spinner';
    readonly INVERSE_SPINNER_CLASS = 'kz-spinner is-inverse';
    readonly ICON_SIZE = KzIconSize.SM;

    readonly label = input.required<string>();
    readonly kind = input<KzBtnKind>(DEFAULT_KZ_BTN_KIND);
    readonly type = input<KzBtnType>(DEFAULT_KZ_BTN_TYPE);
    readonly icon = input<KzIconRef>(DEFAULT_KZ_ICON_REF);
    readonly hasIcon = input<boolean>(false);
    readonly loading = input<boolean>(false);
    readonly disabled = input<boolean>(false);
    readonly fullWidth = input<boolean>(false);
    readonly iconOnly = input<boolean>(false);
    readonly clicked = output<void>();

    private readonly globalService = inject(GlobalService);


    get isFrozen(): boolean {
        return this.disabled() || this.loading();
    }


    get buttonClasses(): string {
        const width = this.fullWidth() ? ' is-full' : '';
        const compact = this.iconOnly() ? ' is-compact' : '';

        return `kz-button kind-${this.kind()}${width}${compact}`;
    }


    get labelClasses(): string {
        return this.iconOnly() ? 'kz-button-label is-compact-label' : 'kz-button-label';
    }


    get spinnerClasses(): string {
        return this.kind() === KzBtnKind.PRIMARY || this.kind() === KzBtnKind.DANGER
            ? this.INVERSE_SPINNER_CLASS
            : this.SPINNER_CLASS;
    }


    get iconImage(): KzIconImage {
        return this.globalService.iconImage(this.icon().name, '');
    }


    get iconTone(): KzTone {
        const inverseKinds: readonly KzBtnKind[] = [KzBtnKind.PRIMARY, KzBtnKind.DANGER];

        return inverseKinds.includes(this.kind()) ? KzTone.DARK : KzTone.NEUTRAL;
    }


    get iconSize(): KzIconSize {
        return this.ICON_SIZE;
    }


    onClick(): void {
        if (this.isFrozen) {
            return;
        }

        this.clicked.emit();
    }
}
