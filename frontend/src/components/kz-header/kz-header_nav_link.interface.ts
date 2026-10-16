import { KzIconName } from '../../models/kz_icon_name.enum';


export interface KzNavLink {
    label: string;
    path: string;
    icon: KzIconName;
    exact: boolean;
}


export const DEFAULT_KZ_NAV_LINK: KzNavLink = {
    label: '',
    path: '/',
    icon: KzIconName.PLANE,
    exact: true,
};
