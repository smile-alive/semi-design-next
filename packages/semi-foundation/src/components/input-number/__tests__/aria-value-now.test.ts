import { describe, expect, it } from 'vite-plus/test';
import InputNumberFoundation from '../foundation';

describe('InputNumberFoundation.getAriaValueNow', () => {
    it.each([
        [100, '100'],
        [-1.5, '-1.5'],
        [1.2e-7, '0.00000012'],
        [123456789, '123456789'],
    ])('%s 写成不带分组的十进制 %s', (number, expected) => {
        expect(InputNumberFoundation.getAriaValueNow(number)).toBe(expected);
    });

    it.each([null, undefined, Infinity, -Infinity, NaN])('%s 没有 aria-valuenow', (number) => {
        expect(InputNumberFoundation.getAriaValueNow(number)).toBeUndefined();
    });
});
