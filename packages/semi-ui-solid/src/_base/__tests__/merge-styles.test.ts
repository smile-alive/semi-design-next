import { describe, expect, it } from 'vite-plus/test';
import mergeStyles from '../merge-styles';

describe('mergeStyles', () => {
    it('全是对象时合并为对象，后面的覆盖前面的', () => {
        expect(mergeStyles({ width: '1px', color: 'red' }, undefined, { width: '2px' })).toEqual({ width: '2px', color: 'red' });
    });

    it('有字符串时按顺序拼成 CSS 文本，跳过空值', () => {
        expect(mergeStyles({ width: '1px', height: undefined }, 'color: red', null, '', { transform: 'none' })).toBe('width: 1px; color: red; transform: none');
    });

    it('对象的值都为空时不留多余的分隔符', () => {
        expect(mergeStyles('color: red', { width: undefined })).toBe('color: red');
    });
});
