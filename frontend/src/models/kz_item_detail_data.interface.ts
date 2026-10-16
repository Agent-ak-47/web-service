import { KzIconName } from './kz_icon_name.enum';
import { KzItemType } from './kz_item_type.enum';
import { KzTone } from './kz_tone.enum';


export interface KzItemDetailRow {
    label: string;
    value: string;
}


export interface KzItemDetailSection {
    id: string;
    title: string;
    rows: KzItemDetailRow[];
}


export interface KzItemDetailData {
    id: number;
    type: KzItemType;
    title: string;
    subtitle: string;
    icon: KzIconName;
    imageUrl: string;
    description: string;
    price: number;
    unitLabel: string;
    badge: string;
    badgeTone: KzTone;
    rows: KzItemDetailRow[];
    sections: KzItemDetailSection[];
    actionLabel: string;
    disabled: boolean;
    disabledLabel: string;
    maxQuantity: number;
}


export const DEFAULT_KZ_ITEM_DETAIL_ROW: KzItemDetailRow = {
    label: '',
    value: '',
};


export const DEFAULT_KZ_ITEM_DETAIL_DATA: KzItemDetailData = {
    id: 0,
    type: KzItemType.FLIGHT,
    title: '',
    subtitle: '',
    icon: KzIconName.PLANE,
    imageUrl: '',
    description: '',
    price: 0,
    unitLabel: '',
    badge: '',
    badgeTone: KzTone.NEUTRAL,
    rows: [],
    sections: [],
    actionLabel: '',
    disabled: false,
    disabledLabel: '',
    maxQuantity: 1,
};