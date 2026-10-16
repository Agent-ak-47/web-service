export enum KzItemType {
    FLIGHT = 'FLIGHT',
    PACKAGE = 'PACKAGE',
    EXCURSION = 'EXCURSION',
}


export const KZ_ITEM_TYPES: readonly KzItemType[] = [
    KzItemType.FLIGHT,
    KzItemType.PACKAGE,
    KzItemType.EXCURSION,
];


export const DEFAULT_KZ_ITEM_TYPE = KzItemType.FLIGHT;
