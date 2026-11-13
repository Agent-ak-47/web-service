import { Component, computed, input, output, signal } from '@angular/core';

import type { KzFieldType } from '../../models/kz_field_type.enum';
import { KzIconImage } from '../../models/kz_icon_image.interface';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KzOption } from '../../models/kz_option.interface';
import { KzTone } from '../../models/kz_tone.enum';
import { KzIcon } from '../kz-icon/kz-icon';


@Component({
    selector: 'kz-field',
    standalone: true,
    imports: [KzIcon],
    templateUrl: './kz-field.html',
    styleUrl: './kz-field.css',
})
export class KzField {
    readonly REQUIRED_MARK = '*';
    readonly ICON_FOLDER = 'assets/icons/';
    readonly ICON_SIZE = KzIconSize.SM;
    readonly ICON_TONE = KzTone.SOFT;

    readonly label = input<string>('');
    readonly name = input<string>('');
    readonly type = input<KzFieldType>('text' as KzFieldType);
    readonly value = input<string>('');
    readonly placeholder = input<string>('');
    readonly hint = input<string>('');
    readonly error = input<string>('');
    readonly required = input<boolean>(false);
    readonly disabled = input<boolean>(false);
    readonly options = input<KzOption[]>([]);
    readonly min = input<string>('');
    readonly max = input<string>('');
    readonly step = input<string>('');
    readonly rows = input<number>(3);
    readonly valueChange = output<string>();

    readonly passwordVisible = signal(false);

    readonly passwordIcon = computed<KzIconImage>(() => ({
        src: `${this.ICON_FOLDER}${this.passwordVisible() ? KzIconName.EYE_OFF : KzIconName.EYE}.svg`,
        alt: this.passwordVisible() ? 'Hide password' : 'Show password',
    }));


    get isPassword(): boolean {
        return this.type() === 'password';
    }


    get htmlType(): string {
        switch (this.type()) {
            case 'email':
                return 'email';
            case 'password':
                return this.passwordVisible() ? 'text' : 'password';
            case 'number':
                return 'number';
            case 'date':
                return 'date';
            case 'time':
                return 'time';
            case 'select':
                return 'select';
            case 'textarea':
                return 'textarea';
            default:
                return 'text';
        }
    }


    get controlClasses(): string {
        const invalid = this.error().length > 0 ? ' has-error' : '';

        return `kz-control${invalid}`;
    }


    togglePassword(): void {
        this.passwordVisible.update((visible) => !visible);
    }


    onInput(event: Event): void {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

        this.valueChange.emit(target.value);
    }
}
