export interface KzRegisterForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    address: string;
}


export const DEFAULT_KZ_REGISTER_FORM: KzRegisterForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
};