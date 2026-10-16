import { KzUser } from './kz_user.interface';
import { DEFAULT_KZ_USER } from './kz_user.interface';
import { KzUserRole } from './kz_user_role.enum';


export interface KzAuthSession {
    jeton: string;
    expiration: string;
    user: KzUser;
}


export const DEFAULT_KZ_AUTH_SESSION: KzAuthSession = {
    jeton: '',
    expiration: '',
    user: {
        ...DEFAULT_KZ_USER,
        role: KzUserRole.CLIENT,
    },
};
