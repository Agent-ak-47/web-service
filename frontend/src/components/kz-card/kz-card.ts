import { Component, inject, input, output } from '@angular/core';

import { KzIconImage } from '../../models/kz_icon_image.interface';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KzItemCardData } from '../../models/kz_item_card_data.interface';
import { KzTone } from '../../models/kz_tone.enum';
import { KzMoneyPipe } from '../../pipes/kz-money.pipe';
import { GlobalService } from '../../services/global.service';
import { KzBtn } from '../kz-btn/kz-btn';
import { KzIcon } from '../kz-icon/kz-icon';


@Component({
    selector: 'kz-card',
    standalone: true,
    imports: [KzBtn, KzIcon, KzMoneyPipe],
    templateUrl: './kz-card.html',
    styleUrl: './kz-card.css',
})
export class KzCard {
    readonly ICON_SIZE = KzIconSize.MD;
    readonly ICON_TONE = KzTone.NEUTRAL;

    readonly data = input.required<KzItemCardData>();
    readonly loading = input<boolean>(false);
    readonly opened = output<KzItemCardData>();
    readonly reserved = output<KzItemCardData>();

    private readonly globalService = inject(GlobalService);


    get iconImage(): KzIconImage {
        return this.globalService.iconImage(this.data().icon, '');
    }


    get iconSize(): KzIconSize {
        return this.ICON_SIZE;
    }


    get coverUrl(): string {
        return this.globalService.assetUrl(this.data().imageUrl);
    }


    get hasCover(): boolean {
        return (this.data().imageUrl ?? '').length > 0;
    }


    get hasBadge(): boolean {
        return this.data().badge.length > 0;
    }


    get badgeClasses(): string {
        return `kz-badge kz-tone-${this.data().badgeTone}`;
    }


    get hostClasses(): string {
        return this.loading() ? 'kz-card is-busy' : 'kz-card';
    }


    get tabIndex(): number {
        return this.loading() ? -1 : 0;
    }


    get buttonLabel(): string {
        return this.data().disabled ? this.data().disabledLabel : this.data().actionLabel;
    }


    stop(event: Event): void {
        event.stopPropagation();
    }


    onOpen(): void {
        if (this.loading()) {
            return;
        }

        this.opened.emit(this.data());
    }


    onReserve(): void {
        if (this.data().disabled) {
            return;
        }

        this.reserved.emit(this.data());
    }
}
