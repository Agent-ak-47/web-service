import { KzIconName } from './kz_icon_name.enum';
import { KzIconSize } from './kz_icon_size.enum';
import { KzTone } from './kz_tone.enum';


export interface KzIconRef {
    name: KzIconName;
    size: KzIconSize;
    tone: KzTone;
}


export const DEFAULT_KZ_ICON_REF: KzIconRef = {
    name: KzIconName.PLANE,
    size: KzIconSize.MD,
    tone: KzTone.NEUTRAL,
};
