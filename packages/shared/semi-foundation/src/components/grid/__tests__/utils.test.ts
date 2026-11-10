import { describe, expect, it } from 'vite-plus/test';
import { getColClassName, getColStyle, getRowClassName } from '../utils';

describe('getColClassName', () => {
    it('基础类名之外只追加 className', () => {
        expect(getColClassName('semi')).toBe('semi-col');
        expect(getColClassName('semi', 'x')).toBe('semi-col x');
    });
});

describe('getColStyle', () => {
    it('没有属性时为空对象', () => {
        expect(getColStyle({})).toEqual({});
    });

    it('顶层属性写成不带后缀的变量，0 也写入', () => {
        expect(getColStyle({ span: 6, offset: 0 })).toEqual({ '--semi-col-span': '6', '--semi-col-offset': '0' });
    });

    it('断点接受数字或对象，变量名带断点后缀', () => {
        expect(getColStyle({ md: 8, lg: { span: 4, order: 0, offset: 0, push: 0, pull: 0 } })).toEqual({
            '--semi-col-span-md': '8',
            '--semi-col-span-lg': '4',
            '--semi-col-offset-lg': '0',
            '--semi-col-push-lg': '0',
            '--semi-col-pull-lg': '0',
            '--semi-col-order-lg': '0',
        });
    });

    it('没有 span 为 0 的层时不写 display 变量', () => {
        expect(Object.keys(getColStyle({ span: 6, xs: 12, md: 8 })).some((name) => name.includes('display'))).toBe(false);
    });

    it('span 为 0 的层写 none，其余写了 span 的层写 block 以重新显示', () => {
        expect(getColStyle({ span: 0, md: 6, xl: { order: 1 } })).toEqual({
            '--semi-col-span': '0',
            '--semi-col-display': 'none',
            '--semi-col-span-md': '6',
            '--semi-col-display-md': 'block',
            '--semi-col-order-xl': '1',
        });
    });
});

describe('getRowClassName', () => {
    it('没有 justify 与 align 时只有基础类名，并保留 className', () => {
        expect(getRowClassName('semi', {}, 'x')).toBe('semi-row x');
    });

    it('justify 与 align 追加类名', () => {
        expect(getRowClassName('semi', { justify: 'center', align: 'middle' })).toBe('semi-row semi-row-justify-center semi-row-align-middle');
    });
});
