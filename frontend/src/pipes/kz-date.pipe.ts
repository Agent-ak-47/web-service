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
    readonly TIME_OPTIONS: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
    };
    readonly TIME_PATTERN = /(\d{2}):(\d{2})/;


    transform(value: string | null | undefined, withTime = false): string {
        if (value === null || value === undefined || value.length === 0) {
            return this.EMPTY_VALUE;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return this.EMPTY_VALUE;
        }

        return new Intl.DateTimeFormat('en-US', withTime ? this.DATETIME_OPTIONS : this.DATE_OPTIONS).format(date);
    }


    transformDateTime(value: string | null | undefined): string {
        if (value === null || value === undefined || value.length === 0) {
            return this.EMPTY_VALUE;
        }

        const normalized = value.includes('T') ? value : `${value}T00:00:00`;

        return this.transform(normalized, true);
    }


    transformTime(value: string | null | undefined): string {
        if (value === null || value === undefined || value.length === 0) {
            return this.EMPTY_VALUE;
        }

        const match = value.match(this.TIME_PATTERN);

        if (match === null) {
            return this.EMPTY_VALUE;
        }

        const date = new Date(`2000-01-01T${match[1]}:${match[2]}`);

        return new Intl.DateTimeFormat('en-US', this.TIME_OPTIONS).format(date);
    }
}
