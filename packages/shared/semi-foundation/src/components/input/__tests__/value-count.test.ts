import { describe, expect, it } from 'vite-plus/test';
import TextEntryFoundation from '../text-entry-foundation';

describe('TextEntryFoundation.getValueCount', () => {
    it('没有 getValueLength 时按 UTF-16 单元计数', () => {
        expect(TextEntryFoundation.getValueCount('a😀')).toBe(3);
    });

    it('有 getValueLength 时按它计数', () => {
        expect(TextEntryFoundation.getValueCount('a😀', () => 2)).toBe(2);
    });

    it.each(['', undefined])('空值 %s 计为 0', (value) => {
        expect(TextEntryFoundation.getValueCount(value, () => 5)).toBe(0);
    });
});
