export interface KzPackageForm {
    name: string;
    description: string;
    destination: string;
    durationNights: string;
    price: string;
    startDate: string;
    endDate: string;
    discountPercentage: string;
    imageUrl: string;
    active: boolean;
}


export const DEFAULT_KZ_PACKAGE_FORM: KzPackageForm = {
    name: '',
    description: '',
    destination: '',
    durationNights: '',
    price: '',
    startDate: '',
    endDate: '',
    discountPercentage: '',
    imageUrl: '',
    active: true,
};


export interface KzPackageFormErrors {
    name: string;
    destination: string;
    durationNights: string;
    price: string;
    discountPercentage: string;
}


export const DEFAULT_KZ_PACKAGE_FORM_ERRORS: KzPackageFormErrors = {
    name: '',
    destination: '',
    durationNights: '',
    price: '',
    discountPercentage: '',
};