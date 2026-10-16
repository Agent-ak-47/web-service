import { Component, inject, input, output } from '@angular/core';

import { KzFieldType } from '../../models/kz_field_type.enum';
import { KzIconImage } from '../../models/kz_icon_image.interface';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KzItemDetailData } from '../../models/kz_item_detail_data.interface';
import { KzTone } from '../../models/kz_tone.enum';
import { KzMoneyPipe } from '../../pipes/kz-money.pipe';
import { GlobalService } from '../../services/global.service';
import { KzBtn } from '../kz-btn/kz-btn';
import { KzField } from '../kz-field/kz-field';
import { KzIcon } from '../kz-icon/kz-icon';


@Component({
    selector: 'kz-item-detail',
    standalone: true,
    imports: [KzBtn, KzField, KzIcon, KzMoneyPipe],
    templateUrl: './kz-item-detail.html',
    styleUrl: './kz-item-detail.css',
})
export class KzItemDetail {
    readonly ICON_SIZE = KzIconSize.LG;
    readonly ICON_TONE = KzTone.NEUTRAL;
    readonly QUANTITY_TYPE = KzFieldType.NUMBER;
    readonly QUANTITY_MIN = '1';
    readonly QUANTITY_STEP = '1';
    readonly DESCRIPTION_TITLE = 'Description';

    readonly data = input.required<KzItemDetailData>();
    readonly quantityLabel = input<string>('');
    readonly quantity = input<number>(1);
    readonly reserving = input<boolean>(false);
    readonly reserved = output<number>();
    readonly quantityChanged = output<number>();

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
        return this.data().imageUrl.length > 0;
    }


    get hasBadge(): boolean {
        return this.data().badge.length > 0;
    }


    get badgeClasses(): string {
        return `kz-badge kz-tone-${this.data().badgeTone}`;
    }


    get hasDescription(): boolean {
        return this.data().description.trim().length > 0;
    }


    get hasQuantity(): boolean {
        return this.quantityLabel().length > 0 && this.data().maxQuantity > 1;
    }


    get buttonLabel(): string {
        return this.data().disabled ? this.data().disabledLabel : this.data().actionLabel;
    }


    get quantityValue(): string {
        return String(this.quantity());
    }


    get quantityMax(): string {
        return String(this.data().maxQuantity);
    }


    get totalPrice(): number {
        return this.data().price * this.quantity();
    }


    get totalLabel(): string {
        return 'Total';
    }


    onQuantityInput(value: string): void {
        const parsed = Number(value);

        if (Number.isNaN(parsed) || parsed < 1) {
            return;
        }

        this.quantityChanged.emit(Math.min(Math.trunc(parsed), this.data().maxQuantity));
    }


    onAction(): void {
        if (this.data().disabled) {
            return;
        }

        this.reserved.emit(this.quantity());
    }
}