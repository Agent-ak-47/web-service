import { KzFormColumns } from './kz_form_columns.enum';
import { KzFormField } from './kz_form_field.interface';


export interface KzFormSection {
    id: string;
    title?: string;
    columns: KzFormColumns;
    fields: KzFormField[];
}


export const DEFAULT_KZ_FORM_SECTION: KzFormSection = {
    id: '',
    title: '',
    columns: KzFormColumns.ONE,
    fields: [],
};