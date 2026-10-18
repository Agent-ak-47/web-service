import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { KzBreadcrumbItem } from '../../models/kz_breadcrumb_item.interface';


@Component({
    selector: 'kz-breadcrumb',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './kz-breadcrumb.html',
    styleUrl: './kz-breadcrumb.css',
})
export class KzBreadcrumb {
    readonly SEPARATOR = '/';
    readonly NAV_LABEL = "Breadcrumb";
    readonly CURRENT_CLASS = 'crumb is-current';
    readonly LINK_CLASS = 'crumb';

    readonly items = input.required<KzBreadcrumbItem[]>();
}