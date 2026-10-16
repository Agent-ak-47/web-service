import { Component, input } from '@angular/core';

import { DEFAULT_KZ_AVATAR_VARIANT, KzAvatarVariant } from '../../models/kz_avatar_variant.enum';


@Component({
    selector: 'kz-avatar',
    standalone: true,
    templateUrl: './kz-avatar.html',
    styleUrl: './kz-avatar.css',
})
export class KzAvatar {
    readonly GOLD_CLASS = 'kz-avatar is-gold';
    readonly NO_LABEL = null;

    readonly initial = input.required<string>();
    readonly label = input<string>('');
    readonly variant = input<KzAvatarVariant>(DEFAULT_KZ_AVATAR_VARIANT);


    get hostClasses(): string {
        return this.variant() === KzAvatarVariant.GOLD ? this.GOLD_CLASS : 'kz-avatar';
    }


    get ariaLabel(): string | null {
        return this.label().length > 0 ? this.label() : this.NO_LABEL;
    }
}