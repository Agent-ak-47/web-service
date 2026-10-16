import { CanDeactivateFn } from '@angular/router';

import { KzGuardedForm } from '../models/kz_guarded_form.interface';
import { KZ_LABELS } from '../models/kz_labels.interface';


export const unsavedChangesGuard: CanDeactivateFn<KzGuardedForm> = (component: KzGuardedForm | null) => {
    if (component === null || !component.hasUnsavedChanges()) {
        return true;
    }

    return window.confirm(KZ_LABELS.unsavedWarning);
};
