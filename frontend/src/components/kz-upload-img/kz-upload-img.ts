import { Component, inject, input, output } from '@angular/core';

import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzIconRef } from '../../models/kz_icon_ref.interface';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KZ_LABELS } from '../../models/kz_labels.interface';
import { KzTone } from '../../models/kz_tone.enum';
import { GlobalService } from '../../services/global.service';
import { KzBtn } from '../kz-btn/kz-btn';


@Component({
    selector: 'kz-upload-img',
    standalone: true,
    imports: [KzBtn],
    templateUrl: './kz-upload-img.html',
    styleUrl: './kz-upload-img.css',
})
export class KzUploadImg {
    readonly PICK_LABEL = 'Choisir une image';
    readonly FORMAT_HINT = 'PNG, JPG ou WEBP, 2 Mo maximum.';
    readonly TYPE_ERROR = 'Le fichier doit etre une image.';
    readonly SIZE_ERROR = 'L image ne doit pas depasser 2 Mo.';
    readonly READ_ERROR = 'L image n a pas pu etre lue.';
    readonly REMOVE_LABEL = KZ_LABELS.remove;
    readonly ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp';
    readonly IMAGE_TYPE_PREFIX = 'image/';
    readonly DATA_URL_PREFIX = 'data:';
    readonly MAX_SIZE_MB = 2;
    readonly MAX_SIZE_BYTES = this.MAX_SIZE_MB * 1024 * 1024;
    readonly PRIMARY_KIND = KzBtnKind.PRIMARY;
    readonly DANGER_KIND = KzBtnKind.DANGER;
    readonly PICK_ICON: KzIconRef = { name: KzIconName.IMAGE, size: KzIconSize.MD, tone: KzTone.NEUTRAL };
    readonly REMOVE_ICON: KzIconRef = { name: KzIconName.TRASH, size: KzIconSize.SM, tone: KzTone.NEUTRAL };

    readonly label = input<string>('');
    readonly value = input<string>('');
    readonly hint = input<string>('');
    readonly error = input<string>('');
    readonly required = input<boolean>(false);
    readonly disabled = input<boolean>(false);
    readonly valueChange = output<string>();

    private readonly globalService = inject(GlobalService);
    private pickedError = '';


    get hasImage(): boolean {
        return this.value().trim().length > 0;
    }


    get isFrozen(): boolean {
        return this.disabled();
    }


    get frameClasses(): string {
        const filled = this.hasImage ? ' is-filled' : '';

        return `upload-frame${filled}`;
    }


    get previewSrc(): string {
        return this.globalService.assetUrl(this.value());
    }


    get message(): string {
        return this.pickedError.length > 0 ? this.pickedError : this.error();
    }


    get hasMessage(): boolean {
        return this.message.length > 0;
    }


    get frameHint(): string {
        return this.hint().length > 0 ? this.hint() : this.FORMAT_HINT;
    }


    onPick(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.item(0) ?? null;

        input.value = '';
        this.pickedError = '';

        if (file === null || this.isFrozen) {
            return;
        }

        if (file.type.startsWith(this.IMAGE_TYPE_PREFIX) === false) {
            this.pickedError = this.TYPE_ERROR;

            return;
        }

        if (file.size > this.MAX_SIZE_BYTES) {
            this.pickedError = this.SIZE_ERROR;

            return;
        }

        this.readAsDataUrl(file);
    }


    onRemove(): void {
        if (this.isFrozen) {
            return;
        }

        this.pickedError = '';
        this.valueChange.emit('');
    }


    private readAsDataUrl(file: File): void {
        const reader = new FileReader();

        reader.onload = (): void => {
            const result = reader.result;

            if (typeof result !== 'string' || result.startsWith(this.DATA_URL_PREFIX) === false) {
                this.pickedError = this.READ_ERROR;

                return;
            }

            this.valueChange.emit(result);
        };

        reader.onerror = (): void => {
            this.pickedError = this.READ_ERROR;
        };

        reader.readAsDataURL(file);
    }
}
