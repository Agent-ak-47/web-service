import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { KzAvatarVariant } from '../../models/kz_avatar_variant.enum';
import { KzAvatar } from './kz-avatar';


describe('KzAvatar', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzAvatar] }).compileComponents();
    });


    it('should create and render the initial', () => {
        const fixture = TestBed.createComponent(KzAvatar);
        fixture.componentRef.setInput('initial', 'A');
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('A');
        expect(fixture.nativeElement.querySelector('.kz-avatar')).toBeTruthy();
    });


    it('should expose the label through aria-label only when provided', () => {
        const fixture = TestBed.createComponent(KzAvatar);
        fixture.componentRef.setInput('initial', 'K');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[aria-label]')).toBeNull();

        fixture.componentRef.setInput('label', 'Kamal');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.kz-avatar').getAttribute('aria-label')).toBe('Kamal');
    });


    it('should apply the gold variant class', () => {
        const fixture = TestBed.createComponent(KzAvatar);
        fixture.componentRef.setInput('initial', 'A');
        fixture.componentRef.setInput('variant', KzAvatarVariant.GOLD);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.kz-avatar').classList).toContain('is-gold');
    });
});
