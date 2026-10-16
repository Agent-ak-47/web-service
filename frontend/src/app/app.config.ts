import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { KzDatePipe } from '../pipes/kz-date.pipe';
import { KzMoneyPipe } from '../pipes/kz-money.pipe';
import { GlobalService } from '../services/global.service';
import { MockBackendService } from '../services/mock-backend.service';
import { routes } from './app.routes';


export const appConfig: ApplicationConfig = {
    providers: [
        KzDatePipe,
        KzMoneyPipe,
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            routes,
            withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
        ),
        provideAppInitializer(() => {
            const globalService = inject(GlobalService);

            if (!globalService.MOCK_MODE) {
                return Promise.resolve();
            }

            return inject(MockBackendService).install();
        }),
    ],
};
