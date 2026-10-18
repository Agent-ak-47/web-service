import { KzUser } from './kz_user.interface';


export interface KzMockUserAccount extends KzUser {
    password: string;
}


export interface KzMockToken {
    id: number;
    name: string;
    email: string;
    role: string;
}


export const DEFAULT_KZ_MOCK_TOKEN: KzMockToken = {
    id: 0,
    name: '',
    email: '',
    role: '',
};
