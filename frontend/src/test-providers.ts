import { EnvironmentProviders, Provider } from '@angular/core';

import { KzDatePipe } from './pipes/kz-date.pipe';
import { KzMoneyPipe } from './pipes/kz-money.pipe';


const TEST_PROVIDERS: (Provider | EnvironmentProviders)[] = [
    KzDatePipe,
    KzMoneyPipe,
];


export default TEST_PROVIDERS;
