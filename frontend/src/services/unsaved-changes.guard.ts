import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { KzGuardedForm } from '../models/kz_guarded_form.interface';
import { KZ_LABELS } from '../models/kz_labels.interface';
import { NavigationService } from './navigation.service';


export const unsavedChangesGuard: CanDeactivateFn<KzGuardedForm> = (component: KzGuardedForm | null) => {
    const navigationService = inject(NavigationService);

    if (navigationService.consumeForcedNavigation()) {
        return true;
    }

    if (component === null || !component.hasUnsavedChanges()) {
        return true;
    }

    return window.confirm(KZ_LABELS.unsavedWarning);
};
