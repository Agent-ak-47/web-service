import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { FlightsSearchPage } from './flights-search-page';


describe('FlightsSearchPage', () => {
    it('should create', async () => {
        await TestBed.configureTestingModule({
            imports: [FlightsSearchPage],
            providers: [provideRouter([])],
        }).compileComponents();

        expect(TestBed.createComponent(FlightsSearchPage).componentInstance).toBeTruthy();
    });
});
