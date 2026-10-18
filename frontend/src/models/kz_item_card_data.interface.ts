import { KzIconName } from './kz_icon_name.enum';
import { KzItemType } from './kz_item_type.enum';
import { KzTone } from './kz_tone.enum';


export interface KzItemCardMeta {
    label: string;
    value: string;
}


export interface KzItemCardData {
    id: number;
    type: KzItemType;
    title: string;
    subtitle: string;
    icon: KzIconName;
    imageUrl: string;
    price: number;
    unitLabel: string;
    badge: string;
    badgeTone: KzTone;
    meta: KzItemCardMeta[];
    actionLabel: string;
    disabled: boolean;
    disabledLabel: string;
}


export const DEFAULT_KZ_ITEM_CARD_DATA: KzItemCardData = {
    id: 0,
    type: KzItemType.FLIGHT,
    title: '',
    subtitle: '',
    icon: KzIconName.PLANE,
    imageUrl: '',
    price: 0,
    unitLabel: '',
    badge: '',
    badgeTone: KzTone.NEUTRAL,
    meta: [],
    actionLabel: '',
    disabled: false,
    disabledLabel: '',
};


export const DEFAULT_KZ_ITEM_CARD_META: KzItemCardMeta = {
    label: '',
    value: '',
};
