import { Component, input, output } from '@angular/core';

import { KzFieldType } from '../../models/kz_field_type.enum';
import { KzOption } from '../../models/kz_option.interface';


@Component({
    selector: 'kz-field',
    standalone: true,
    templateUrl: './kz-field.html',
    styleUrl: './kz-field.css',
})
export class KzField {
    readonly REQUIRED_MARK = '*';
    readonly FIELD_TYPE = KzFieldType;

    readonly label = input<string>('');
    readonly name = input<string>('');
    readonly type = input<KzFieldType>(KzFieldType.TEXT);
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


    get htmlType(): string {
        switch (this.type()) {
            case KzFieldType.EMAIL:
                return 'email';
            case KzFieldType.PASSWORD:
                return 'password';
            case KzFieldType.NUMBER:
                return 'number';
            case KzFieldType.DATE:
                return 'date';
            case KzFieldType.TIME:
                return 'time';
            case KzFieldType.SELECT:
                return 'select';
            case KzFieldType.TEXTAREA:
                return 'textarea';
            default:
                return 'text';
        }
    }


    get controlClasses(): string {
        const invalid = this.error().length > 0 ? ' has-error' : '';

        return `kz-control${invalid}`;
    }


    onInput(event: Event): void {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

        this.valueChange.emit(target.value);
    }
}
