import { Injectable } from '@angular/core';

import { KzBreadcrumbItem } from '../models/kz_breadcrumb_item.interface';


export const DEFAULT_KZ_BREADCRUMB_ITEMS: KzBreadcrumbItem[] = [];


@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
    readonly DEFAULT_ITEMS = DEFAULT_KZ_BREADCRUMB_ITEMS;

    items: KzBreadcrumbItem[] = this.DEFAULT_ITEMS;


    get hasItems(): boolean {
        return this.items.length > 0;
    }


    set(items: KzBreadcrumbItem[]): void {
        this.items = items;
    }


    clear(): void {
        this.items = this.DEFAULT_ITEMS;
    }
}