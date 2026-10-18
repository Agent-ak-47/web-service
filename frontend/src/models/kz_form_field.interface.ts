import { KzFieldType } from './kz_field_type.enum';
import { KzOption } from './kz_option.interface';


export interface KzFormField {
    name: string;
    label: string;
    type: KzFieldType;
    value: string;
    placeholder: string;
    hint: string;
    error: string;
    required: boolean;
    disabled: boolean;
    min: string;
    max: string;
    step: string;
    rows: number;
    options: KzOption[];
}


export const DEFAULT_KZ_FORM_FIELD: KzFormField = {
    name: '',
    label: '',
    type: KzFieldType.TEXT,
    value: '',
    placeholder: '',
    hint: '',
    error: '',
    required: false,
    disabled: false,
    min: '',
    max: '',
    step: '',
    rows: 3,
    options: [],
};