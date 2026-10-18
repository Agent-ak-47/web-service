import { Component, input, output } from '@angular/core';

import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KzFormColumns } from '../../models/kz_form_columns.enum';
import { KzFormField } from '../../models/kz_form_field.interface';
import { KzFormFieldChange } from '../../models/kz_form_field_change.interface';
import { KzFormSection } from '../../models/kz_form_section.interface';
import { KZ_LABELS } from '../../models/kz_labels.interface';
import { KzBtn } from '../kz-btn/kz-btn';
import { KzField } from '../kz-field/kz-field';


@Component({
    selector: 'kz-form-panel',
    standalone: true,
    imports: [KzBtn, KzField],
    templateUrl: './kz-form-panel.html',
    styleUrl: './kz-form-panel.css',
})
export class KzFormPanel {
    readonly SAVE_LABEL = 'Enregistrer';
    readonly CANCEL_LABEL = KZ_LABELS.cancel;
    readonly PRIMARY_KIND = KzBtnKind.PRIMARY;
    readonly SECONDARY_KIND = KzBtnKind.SECONDARY;

    readonly title = input<string>('');
    readonly sections = input<KzFormSection[]>([]);
    readonly validationMessage = input<string>('');
    readonly activeLabel = input<string>('');
    readonly activeKind = input<KzBtnKind>(KzBtnKind.SECONDARY);
    readonly loading = input<boolean>(false);
    readonly disabled = input<boolean>(false);

    readonly fieldChange = output<KzFormFieldChange>();
    readonly saved = output<void>();
    readonly cancelled = output<void>();
    readonly activeToggled = output<void>();


    onFieldChange(field: KzFormField, value: string): void {
        this.fieldChange.emit({ name: field.name, value });
    }


    rowClasses(columns: KzFormColumns): string {
        switch (columns) {
            case KzFormColumns.TWO:
                return 'form-row is-two';
            case KzFormColumns.THREE:
                return 'form-row is-three';
            default:
                return 'form-row';
        }
    }
}