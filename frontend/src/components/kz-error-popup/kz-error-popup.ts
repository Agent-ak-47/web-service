import { Component, HostListener, inject, input, output } from '@angular/core';

import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KzIconImage } from '../../models/kz_icon_image.interface';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KZ_LABELS } from '../../models/kz_labels.interface';
import { KzTone } from '../../models/kz_tone.enum';
import { GlobalService } from '../../services/global.service';
import { KzBtn } from '../kz-btn/kz-btn';
import { KzIcon } from '../kz-icon/kz-icon';


@Component({
    selector: 'kz-error-popup',
    standalone: true,
    imports: [KzBtn, KzIcon],
    templateUrl: './kz-error-popup.html',
    styleUrl: './kz-error-popup.css',
})
export class KzErrorPopup {
    readonly DEFAULT_TITLE = 'Something went wrong';
    readonly ICON_NAME = KzIconName.WARNING;
    readonly ICON_SIZE = KzIconSize.LG;
    readonly ICON_TONE = KzTone.DANGER;
    readonly CLOSE_LABEL = KZ_LABELS.close;
    readonly CLOSE_KIND = KzBtnKind.PRIMARY;

    readonly open = input<boolean>(false);
    readonly title = input<string>(this.DEFAULT_TITLE);
    readonly message = input<string>('');
    readonly hint = input<string>('');
    readonly closed = output<void>();

    private readonly globalService = inject(GlobalService);


    get iconImage(): KzIconImage {
        return this.globalService.iconImage(this.ICON_NAME, '');
    }


    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.open()) {
            this.closed.emit();
        }
    }


    onBackdrop(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closed.emit();
        }
    }
}
