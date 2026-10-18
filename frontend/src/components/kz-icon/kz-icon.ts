import { Component, input } from '@angular/core';

import { KzIconImage } from '../../models/kz_icon_image.interface';
import { DEFAULT_KZ_ICON_SIZE, KzIconSize } from '../../models/kz_icon_size.enum';
import { KzIconName } from '../../models/kz_icon_name.enum';
import { DEFAULT_KZ_TONE, KzTone } from '../../models/kz_tone.enum';


@Component({
    selector: 'kz-icon',
    standalone: true,
    templateUrl: './kz-icon.html',
    styleUrl: './kz-icon.css',
    host: {
        '[class]': 'hostClasses',
    },
})
export class KzIcon {
    readonly DEFAULT_ICON_NAME = KzIconName.PLANE;

    readonly img = input.required<KzIconImage>();
    readonly size = input<KzIconSize>(DEFAULT_KZ_ICON_SIZE);
    readonly tone = input<KzTone>(DEFAULT_KZ_TONE);
    readonly withBackground = input<boolean>(false);


    get iconName(): string {
        const fileName = this.img().src.split('/').pop() ?? '';
        const rawName = fileName.replace('.svg', '');
        const names: readonly string[] = Object.values(KzIconName);

        return names.includes(rawName) ? rawName : this.DEFAULT_ICON_NAME;
    }


    get hostClasses(): string {
        const background = this.withBackground() ? ' has-background' : '';

        return `kz-icon-host size-${this.size()} tone-${this.tone()}${background}`;
    }


    get iconClasses(): string {
        return `kz-icon is-${this.iconName}`;
    }
}
