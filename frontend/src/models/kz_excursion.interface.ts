export interface KzExcursion {
    id: number;
    title: string;
    location: string;
    description: string;
    date: string;
    startTime: string;
    dureeMinutes: number;
    capacity: number;
    availableSeats: number;
    price: number;
    imageUrl: string;
    guide: string;
    available: boolean;
}


export const DEFAULT_KZ_EXCURSION: KzExcursion = {
    id: 0,
    title: '',
    location: '',
    description: '',
    date: '',
    startTime: '',
    dureeMinutes: 0,
    capacity: 0,
    availableSeats: 0,
    price: 0,
    imageUrl: '',
    guide: '',
    available: true,
};
