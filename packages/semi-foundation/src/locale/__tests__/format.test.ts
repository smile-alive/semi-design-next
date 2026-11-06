import { describe, expect, it } from 'vite-plus/test';
import { formatLocale } from '../format';

describe('formatLocale', () => {
    it('替换同一占位符的所有出现', () => {
        expect(formatLocale('${n} of ${n}', { n: 3 })).toBe('3 of 3');
    });

    it('替换值原样插入，不解释 $& 与 $1', () => {
        expect(formatLocale('close ${tag}', { tag: 'a$&b$1' })).toBe('close a$&b$1');
    });

    it('数字值转成字符串，多个占位符一次替换', () => {
        expect(formatLocale('${a}-${b}', { a: 0, b: 12 })).toBe('0-12');
    });

    it('缺失的键原样保留', () => {
        expect(formatLocale('${a} ${b}', { a: 'x' })).toBe('x ${b}');
    });
});
