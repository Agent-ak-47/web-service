import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KZ_LABELS } from '../models/kz_labels.interface';
import { KzItemType } from '../models/kz_item_type.enum';
import { AuthService } from './auth.service';
import { ItemDetailService } from './item-detail.service';


const auth = {
    authHeaders: {},
    isSignedIn: true,
    clearSession: vi.fn(),
    savePendingReservation: vi.fn(),
};


function response(body: unknown, status = 200): { status: number; json: () => Promise<unknown> } {
    return { status, json: async () => body };
}


describe('ItemDetailService', () => {
    let service: ItemDetailService;

    beforeEach(() => {
        auth.clearSession.mockReset();
        auth.savePendingReservation.mockReset();
        TestBed.configureTestingModule({
            providers: [
                ItemDetailService,
                { provide: AuthService, useValue: auth },
            ],
        });
        service = TestBed.inject(ItemDetailService);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });


    it('should return the item when the request succeeds', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: { id: 1 } })));

        await expect(service.load<{ id: number }>('/api/flights/1')).resolves.toEqual({
            item: { id: 1 },
            error: '',
            signedOut: false,
        });
    });


    it('should return an error instead of staying stuck when the item request fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

        await expect(service.load('/api/flights/1')).resolves.toEqual({
            item: null,
            error: KZ_LABELS.unexpectedError,
            signedOut: false,
        });
    });


    it('should return an error instead of staying stuck when the reservation request fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

        await expect(service.reserve(KzItemType.FLIGHT, 1, 2)).resolves.toEqual({
            path: '',
            error: KZ_LABELS.unexpectedError,
            signedOut: false,
        });
    });
});
