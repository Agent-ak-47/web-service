import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { KzFooter } from '../components/kz-footer/kz-footer';
import { KzHeader } from '../components/kz-header/kz-header';


@Component({
    selector: 'kz-root',
    standalone: true,
    imports: [KzFooter, KzHeader, RouterOutlet],
    templateUrl: './app.html',
    styleUrl: './app.css',
})
export class App {
}
