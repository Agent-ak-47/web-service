import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundPage } from './not-found-page';


describe('NotFoundPage', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NotFoundPage],
            providers: [provideRouter([])],
        }).compileComponents();
    });


    it('should render the 404 content', () => {
        const fixture = TestBed.createComponent(NotFoundPage);
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;

        expect(text).toContain('404');
        expect(text).toContain('Page not found');
        expect(text).toContain('The requested page does not exist or has been moved.');
    });


    it('should navigate home', () => {
        const fixture = TestBed.createComponent(NotFoundPage);
        fixture.detectChanges();
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

        fixture.componentInstance.goHome();

        expect(navigate).toHaveBeenCalledWith('/');
    });
});
