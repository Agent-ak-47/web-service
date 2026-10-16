import { Component, input } from '@angular/core';

import { KZ_LABELS } from '../../models/kz_labels.interface';


@Component({
    selector: 'kz-loading',
    standalone: true,
    templateUrl: './kz-loading.html',
    styleUrl: './kz-loading.css',
})
export class KzLoading {
    readonly SPINNER_CLASS = 'kz-spinner is-large';

    readonly label = input<string>(KZ_LABELS.loading);
    readonly compact = input<boolean>(false);
}
