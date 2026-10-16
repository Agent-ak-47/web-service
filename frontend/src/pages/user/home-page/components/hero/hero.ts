import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { KzHeroAction } from './hero_action.interface';


@Component({
    selector: 'kz-hero',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './hero.html',
    styleUrl: './hero.css',
})
export class Hero {
    readonly title = input.required<string>();
    readonly subtitle = input.required<string>();
    readonly actions = input.required<KzHeroAction[]>();
}
