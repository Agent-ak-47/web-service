import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'kzDate',
    standalone: true,
})
export class KzDatePipe implements PipeTransform {
    readonly EMPTY_VALUE = '-';
    readonly DATE_OPTIONS: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    readonly DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };


    transform(value: string | null | undefined, withTime = false): string {
        if (value === null || value === undefined || value.length === 0) {
            return this.EMPTY_VALUE;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return this.EMPTY_VALUE;
        }

        return new Intl.DateTimeFormat('fr-FR', withTime ? this.DATETIME_OPTIONS : this.DATE_OPTIONS).format(date);
    }
}
