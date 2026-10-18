import { KzUserRole } from './kz_user_role.enum';


export interface KzUser {
    id: number;
    name: string;
    email: string;
    role: KzUserRole;
    phone: string;
    address: string;
}


export const DEFAULT_KZ_USER: KzUser = {
    id: 0,
    name: '',
    email: '',
    role: KzUserRole.CLIENT,
    phone: '',
    address: '',
};
