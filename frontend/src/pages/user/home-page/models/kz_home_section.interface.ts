import { KzIconName } from '../../../../models/kz_icon_name.enum';
import { KzItemType } from '../../../../models/kz_item_type.enum';
import { KzItemCardData } from '../../../../models/kz_item_card_data.interface';


export interface KzHomeSection {
    id: string;
    title: string;
    subtitle: string;
    linkLabel: string;
    path: string;
    type: KzItemType;
    icon: KzIconName;
    cards: KzItemCardData[];
}


export const DEFAULT_KZ_HOME_SECTION: KzHomeSection = {
    id: '',
    title: '',
    subtitle: '',
    linkLabel: '',
    path: '/',
    type: KzItemType.PACKAGE,
    icon: KzIconName.SUITCASE,
    cards: [],
};
