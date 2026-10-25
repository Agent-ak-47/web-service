import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { KzIconName } from '../../models/kz_icon_name.enum';
import { KzIconSize } from '../../models/kz_icon_size.enum';
import { KzTone } from '../../models/kz_tone.enum';
import { KzIcon } from './kz-icon';


describe('KzIcon', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzIcon] }).compileComponents();
    });


    it('should render the image source and alt text', () => {
        const fixture = TestBed.createComponent(KzIcon);
        fixture.componentRef.setInput('img', { src: 'assets/icons/plane.svg', alt: 'Plane' });
        fixture.detectChanges();

        const image = fixture.nativeElement.querySelector('img');

        expect(image.getAttribute('src')).toBe('assets/icons/plane.svg');
        expect(image.getAttribute('alt')).toBe('Plane');
        expect(image.classList).toContain('is-plane');
    });


    it('should apply size, tone and background host classes', () => {
        const fixture = TestBed.createComponent(KzIcon);
        fixture.componentRef.setInput('img', { src: 'assets/icons/logo.svg', alt: '' });
        fixture.componentRef.setInput('size', KzIconSize.LG);
        fixture.componentRef.setInput('tone', KzTone.DARK);
        fixture.componentRef.setInput('withBackground', true);
        fixture.detectChanges();

        const hostClasses = fixture.nativeElement.classList;

        expect(hostClasses).toContain('size-lg');
        expect(hostClasses).toContain('tone-dark');
        expect(hostClasses).toContain('has-background');
    });


    it('should fall back to the default icon name for an unknown file', () => {
        const fixture = TestBed.createComponent(KzIcon);
        fixture.componentRef.setInput('img', { src: 'assets/icons/unknown.svg', alt: '' });
        fixture.detectChanges();

        expect(fixture.componentInstance.iconName).toBe(KzIconName.PLANE);
        expect(fixture.nativeElement.querySelector('img').classList).toContain('is-plane');
    });
});
