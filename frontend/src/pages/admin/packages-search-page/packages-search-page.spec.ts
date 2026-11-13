import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { PackagesSearchPage } from './packages-search-page';


describe('PackagesSearchPage', () => {
    it('should create', async () => {
        await TestBed.configureTestingModule({
            imports: [PackagesSearchPage],
            providers: [provideRouter([])],
        }).compileComponents();

        expect(TestBed.createComponent(PackagesSearchPage).componentInstance).toBeTruthy();
    });
});
