import { KzFieldType } from './kz_field_type.enum';
import { KzOption } from './kz_option.interface';


export interface KzFilterField {
    name: string;
    label: string;
    type: KzFieldType;
    value: string;
    placeholder: string;
    options: KzOption[];
}


export const DEFAULT_KZ_FILTER_FIELD: KzFilterField = {
    name: '',
    label: '',
    type: KzFieldType.TEXT,
    value: '',
    placeholder: '',
    options: [],
};
