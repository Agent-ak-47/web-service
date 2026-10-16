import { KzIconName } from '../../../../../models/kz_icon_name.enum';


export interface KzHeroAction {
    label: string;
    path: string;
    icon: KzIconName;
}


export const DEFAULT_KZ_HERO_ACTION: KzHeroAction = {
    label: '',
    path: '/',
    icon: KzIconName.PLANE,
};
