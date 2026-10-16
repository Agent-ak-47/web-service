import { KzIconName } from '../../../../models/kz_icon_name.enum';
import { KzIconRef } from '../../../../models/kz_icon_ref.interface';
import { KzIconSize } from '../../../../models/kz_icon_size.enum';
import { KzTone } from '../../../../models/kz_tone.enum';


export interface KzDashboardLink {
    label: string;
    path: string;
    icon: KzIconRef;
}


export const DEFAULT_KZ_DASHBOARD_LINK: KzDashboardLink = {
    label: '',
    path: '',
    icon: {
        name: KzIconName.PLANE,
        size: KzIconSize.MD,
        tone: KzTone.NEUTRAL,
    },
};