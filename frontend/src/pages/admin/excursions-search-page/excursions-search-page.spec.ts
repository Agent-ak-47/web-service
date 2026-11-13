import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { ExcursionsSearchPage } from './excursions-search-page';


describe('ExcursionsSearchPage', () => {
    it('should create', async () => {
        await TestBed.configureTestingModule({
            imports: [ExcursionsSearchPage],
            providers: [provideRouter([])],
        }).compileComponents();

        expect(TestBed.createComponent(ExcursionsSearchPage).componentInstance).toBeTruthy();
    });
});
