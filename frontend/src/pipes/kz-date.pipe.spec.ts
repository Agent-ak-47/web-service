import { describe, expect, it } from 'vitest';

import { KzDatePipe } from './kz-date.pipe';


describe('KzDatePipe', () => {
    const pipe = new KzDatePipe();


    it('should format a date without the time', () => {
        expect(pipe.transform('2026-06-01T12:00:00')).toBe('06/01/2026');
    });


    it('should format a date-only value with a 12:00 AM time', () => {
        expect(pipe.transformDateTime('2026-06-01')).toMatch(/^06\/01\/2026,\s12:00\sAM$/i);
    });


    it('should format a time with AM/PM', () => {
        expect(pipe.transformTime('09:00')).toMatch(/^09:00\sAM$/i);
        expect(pipe.transformTime('14:30')).toMatch(/^02:30\sPM$/i);
    });


    it('should return the empty marker for missing values', () => {
        expect(pipe.transform(null)).toBe(pipe.EMPTY_VALUE);
        expect(pipe.transformDateTime('')).toBe(pipe.EMPTY_VALUE);
        expect(pipe.transformTime(undefined)).toBe(pipe.EMPTY_VALUE);
    });
});
