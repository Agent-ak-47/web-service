import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class NavigationService {
    private forced = false;


    forceNextNavigation(): void {
        this.forced = true;
    }


    consumeForcedNavigation(): boolean {
        const forced = this.forced;
        this.forced = false;

        return forced;
    }
}
