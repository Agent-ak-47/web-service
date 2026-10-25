import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KzUploadImg } from './kz-upload-img';


function pickEvent(file: File): Event {
    return {
        target: {
            files: { item: () => file },
            value: '',
        },
    } as unknown as Event;
}


describe('KzUploadImg', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KzUploadImg] }).compileComponents();
    });


    it('should show the pick button and the default hint without an image', () => {
        const fixture = TestBed.createComponent(KzUploadImg);
        fixture.componentRef.setInput('label', 'Cover');
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Cover');
        expect(fixture.nativeElement.textContent).toContain('Choose an image');
        expect(fixture.nativeElement.textContent).toContain('PNG, JPG or WEBP, 2 MB max.');
        expect(fixture.nativeElement.querySelector('.kz-upload-preview')).toBeNull();
    });


    it('should render the preview and emit an empty value on remove', () => {
        const fixture = TestBed.createComponent(KzUploadImg);
        fixture.componentRef.setInput('label', 'Cover');
        fixture.componentRef.setInput('value', 'data:image/png;base64,abc');
        fixture.detectChanges();
        const valueChange = vi.fn();
        fixture.componentInstance.valueChange.subscribe(valueChange);

        expect(fixture.nativeElement.querySelector('.kz-upload-preview').getAttribute('src')).toContain('data:image/png');

        fixture.componentInstance.onRemove();

        expect(valueChange).toHaveBeenCalledWith('');
    });


    it('should reject a non-image file with an error message', () => {
        const fixture = TestBed.createComponent(KzUploadImg);
        fixture.detectChanges();

        fixture.componentInstance.onPick(pickEvent(new File(['text'], 'file.txt', { type: 'text/plain' })));
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('The file must be an image.');
    });


    it('should not emit or remove while disabled', () => {
        const fixture = TestBed.createComponent(KzUploadImg);
        fixture.componentRef.setInput('value', 'data:image/png;base64,abc');
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();
        const valueChange = vi.fn();
        fixture.componentInstance.valueChange.subscribe(valueChange);

        fixture.componentInstance.onRemove();

        expect(valueChange).not.toHaveBeenCalled();
        expect(fixture.nativeElement.querySelector('input[type="file"]').disabled).toBe(true);
    });
});
