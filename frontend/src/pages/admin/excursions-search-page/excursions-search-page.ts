import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { KzBtnKind } from '../../../models/kz_btn_kind.enum';
import { KzFieldType } from '../../../models/kz_field_type.enum';
import { KzFilterField } from '../../../models/kz_filter_field.interface';
import { addQuery, cleanQueryParams, KzQueryParams } from '../../../models/kz_query';
import { GlobalService } from '../../../services/global.service';
import { KzBtn } from '../../../components/kz-btn/kz-btn';
import { KzFilterBar } from '../../../components/kz-filter-bar/kz-filter-bar';


@Component({
    selector: 'kz-excursions-search-page',
    standalone: true,
    imports: [KzBtn, KzFilterBar],
    templateUrl: './excursions-search-page.html',
    styleUrl: './excursions-search-page.css',
})
export class ExcursionsSearchPage implements OnInit {
    readonly PAGE_TITLE = 'Search excursions';
    readonly PAGE_SUBTITLE = 'Find excursions by title, location or guide.';
    readonly SEARCH_KEY = 'search';
    readonly SEARCH_PLACEHOLDER = 'Title, location, guide';
    readonly BACK_LABEL = 'Back to excursions';
    readonly BACK_KIND = KzBtnKind.GHOST;

    private readonly globalService = inject(GlobalService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    search = '';
    isLoading = false;

    get filters(): KzFilterField[] {
        return [{
            name: this.SEARCH_KEY,
            label: 'Search',
            type: KzFieldType.TEXT,
            value: this.search,
            placeholder: this.SEARCH_PLACEHOLDER,
            options: [],
        }];
    }

    ngOnInit(): void {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.search = params.get(this.SEARCH_KEY) ?? '';
            });
    }

    onSearchChanged(values: Record<string, string>): void {
        this.search = values[this.SEARCH_KEY] ?? '';
    }

    onSearchSubmitted(): void {
        this.router.navigateByUrl(addQuery(this.globalService.pages.adminExcursions, this.queryParams()));
    }

    onSearchReset(): void {
        this.search = '';
        this.router.navigateByUrl(this.globalService.pages.adminExcursions);
    }

    onBack(): void {
        this.router.navigateByUrl(this.globalService.pages.adminExcursions);
    }

    private queryParams(): KzQueryParams {
        return cleanQueryParams({ [this.SEARCH_KEY]: this.search });
    }
}
