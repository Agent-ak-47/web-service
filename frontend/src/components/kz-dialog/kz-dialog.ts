import { Component, input, output } from '@angular/core';

import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KZ_LABELS } from '../../models/kz_labels.interface';
import { KzBtn } from '../kz-btn/kz-btn';


@Component({
    selector: 'kz-dialog',
    standalone: true,
    imports: [KzBtn],
    templateUrl: './kz-dialog.html',
    styleUrl: './kz-dialog.css',
})
export class KzDialog {
    readonly CONFIRM_KIND = KzBtnKind.DANGER;
    readonly CANCEL_KIND = KzBtnKind.GHOST;
    readonly CONFIRM_LABEL = KZ_LABELS.confirm;
    readonly CANCEL_LABEL = KZ_LABELS.cancel;
    readonly CONFIRM_BUSY_LABEL = KZ_LABELS.saving;

    readonly open = input<boolean>(false);
    readonly title = input<string>('');
    readonly message = input<string>('');
    readonly confirmLabel = input<string>(KZ_LABELS.confirm);
    readonly loading = input<boolean>(false);
    readonly confirmed = output<void>();
    readonly cancelled = output<void>();


    onBackdrop(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.cancelled.emit();
        }
    }
}
