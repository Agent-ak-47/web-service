import { Component, input, output } from '@angular/core';

import { KzBtnKind } from '../../models/kz_btn_kind.enum';
import { KzBtnType } from '../../models/kz_btn_type.enum';
import { KzFilterField } from '../../models/kz_filter_field.interface';
import { KzLabels } from '../../models/kz_labels.interface';
import { KZ_LABELS } from '../../models/kz_labels.interface';
import { KzBtn } from '../kz-btn/kz-btn';
import { KzField } from '../kz-field/kz-field';


@Component({
    selector: 'kz-filter-bar',
    standalone: true,
    imports: [KzBtn, KzField],
    templateUrl: './kz-filter-bar.html',
    styleUrl: './kz-filter-bar.css',
})
export class KzFilterBar {
    readonly SEARCH_KIND = KzBtnKind.PRIMARY;
    readonly RESET_KIND = KzBtnKind.GHOST;
    readonly SUBMIT_TYPE = KzBtnType.SUBMIT;
    readonly SEARCH_LABEL = KZ_LABELS.search;
    readonly RESET_LABEL = KZ_LABELS.reset;
    readonly LOADING_LABEL = KZ_LABELS.searching;

    readonly labels: KzLabels = KZ_LABELS;

    readonly fields = input.required<KzFilterField[]>();
    readonly loading = input<boolean>(false);
    readonly changed = output<Record<string, string>>();
    readonly submitted = output<Record<string, string>>();
    readonly reseted = output<void>();


    get currentValues(): Record<string, string> {
        const values: Record<string, string> = {};

        for (const field of this.fields()) {
            values[field.name] = field.value;
        }

        return values;
    }


    onFieldChange(name: string, value: string): void {
        this.changed.emit({ ...this.currentValues, [name]: value });
    }


    onSubmit(event: Event): void {
        event.preventDefault();

        this.submitted.emit(this.currentValues);
    }


    onReset(): void {
        const emptyValues: Record<string, string> = {};

        for (const field of this.fields()) {
            emptyValues[field.name] = '';
        }

        this.changed.emit(emptyValues);
        this.reseted.emit();
    }
}
