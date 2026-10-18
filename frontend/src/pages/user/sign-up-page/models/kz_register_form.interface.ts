export interface KzRegisterForm {
    email: string;
    password: string;
    confirmPassword: string;
}


export const DEFAULT_KZ_REGISTER_FORM: KzRegisterForm = {
    email: '',
    password: '',
    confirmPassword: '',
};