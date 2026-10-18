import { inject, Pipe, PipeTransform } from '@angular/core';

import { GlobalService } from '../services/global.service';


@Pipe({
    name: 'kzMoney',
    standalone: true,
})
export class KzMoneyPipe implements PipeTransform {
    private readonly globalService = inject(GlobalService);


    transform(value: number | null | undefined): string {
        const amount = value ?? 0;

        return `${amount.toFixed(2)} ${this.globalService.currency}`;
    }
}
