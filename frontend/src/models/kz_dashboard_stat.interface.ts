import { KzIconName } from './kz_icon_name.enum';
import { KzTone } from './kz_tone.enum';


export interface KzDashboardStat {
    label: string;
    value: string;
    hint: string;
    icon: KzIconName;
    tone: KzTone;
}


export const DEFAULT_KZ_DASHBOARD_STAT: KzDashboardStat = {
    label: '',
    value: '',
    hint: '',
    icon: KzIconName.RECEIPT,
    tone: KzTone.NEUTRAL,
};