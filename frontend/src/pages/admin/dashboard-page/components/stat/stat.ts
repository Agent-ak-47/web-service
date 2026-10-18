import { Component, inject, input } from '@angular/core';

import { KzIconImage } from '../../../../../models/kz_icon_image.interface';
import { KzIconName } from '../../../../../models/kz_icon_name.enum';
import { KzIconSize } from '../../../../../models/kz_icon_size.enum';
import { KzTone } from '../../../../../models/kz_tone.enum';
import { GlobalService } from '../../../../../services/global.service';
import { KzIcon } from '../../../../../components/kz-icon/kz-icon';


@Component({
    selector: 'kz-stat',
    standalone: true,
    imports: [KzIcon],
    templateUrl: './stat.html',
    styleUrl: './stat.css',
})
export class Stat {
    readonly ICON_SIZE = KzIconSize.LG;

    readonly label = input.required<string>();
    readonly value = input.required<string>();
    readonly hint = input<string>('');
    readonly icon = input.required<KzIconName>();
    readonly tone = input<KzTone>(KzTone.NEUTRAL);

    private readonly globalService = inject(GlobalService);


    get iconImage(): KzIconImage {
        return this.globalService.iconImage(this.icon(), '');
    }
}