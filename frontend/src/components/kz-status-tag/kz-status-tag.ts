import { Component, input } from '@angular/core';

import { KzPaymentStatus } from '../../models/kz_payment_status.enum';
import { KzReservationStatus } from '../../models/kz_reservation_status.enum';
import { KzTone } from '../../models/kz_tone.enum';
import { KzStatusLabels } from './kz-status-tag_labels.interface';


@Component({
    selector: 'kz-status-tag',
    standalone: true,
    templateUrl: './kz-status-tag.html',
    styleUrl: './kz-status-tag.css',
})
export class KzStatusTag {
    readonly LABELS: KzStatusLabels = {
        label: {
            [KzReservationStatus.PENDING]: 'Pending',
            [KzReservationStatus.CONFIRMED]: 'Confirmed',
            [KzReservationStatus.PAID]: 'Paid',
            [KzReservationStatus.CANCELLED]: 'Cancelled',
            [KzReservationStatus.REFUNDED]: 'Refunded',
            [KzReservationStatus.EXPIRED]: 'Expired',
            [KzPaymentStatus.SUCCEEDED]: 'Payment accepted',
            [KzPaymentStatus.FAILED]: 'Payment declined',
        },
        tone: {
            [KzReservationStatus.PENDING]: KzTone.WARNING,
            [KzReservationStatus.CONFIRMED]: KzTone.NEUTRAL,
            [KzReservationStatus.PAID]: KzTone.SUCCESS,
            [KzReservationStatus.CANCELLED]: KzTone.DANGER,
            [KzReservationStatus.REFUNDED]: KzTone.SOFT,
            [KzReservationStatus.EXPIRED]: KzTone.SOFT,
            [KzPaymentStatus.SUCCEEDED]: KzTone.SUCCESS,
            [KzPaymentStatus.FAILED]: KzTone.DANGER,
        },
    };

    readonly value = input.required<string>();


    get label(): string {
        return this.LABELS.label[this.value()] ?? this.value();
    }


    get tone(): KzTone {
        return this.LABELS.tone[this.value()] ?? KzTone.NEUTRAL;
    }


    get tagClasses(): string {
        return `kz-badge kz-tone-${this.tone}`;
    }
}
