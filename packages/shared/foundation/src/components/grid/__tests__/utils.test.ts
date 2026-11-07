import { describe, expect, it } from 'vite-plus/test';
import { getColClassName, getRowClassName } from '../utils';

describe('getColClassName', () => {
    it('只有前缀时返回基础类名，并保留 className', () => {
        expect(getColClassName('semi', {})).toBe('semi-col');
        expect(getColClassName('semi', { span: 6 }, 'x')).toBe('semi-col semi-col-6 x');
    });

    it('顶层 order、offset、push、pull 为 0 时不生成类名，span 为 0 时生成', () => {
        expect(getColClassName('semi', { span: 0, order: 0, offset: 0, push: 0, pull: 0 })).toBe('semi-col semi-col-0');
        expect(getColClassName('semi', { order: 1, offset: 2, push: 3, pull: 4 })).toBe('semi-col semi-col-order-1 semi-col-offset-2 semi-col-push-3 semi-col-pull-4');
    });

    it('断点接受数字或对象，对象中的 0 仍生成类名', () => {
        expect(getColClassName('semi', { md: 8 })).toBe('semi-col semi-col-md-8');
        expect(getColClassName('semi', { lg: { span: 4, order: 0, offset: 0, push: 0, pull: 0 } })).toBe('semi-col semi-col-lg-4 semi-col-lg-order-0 semi-col-lg-offset-0 semi-col-lg-push-0 semi-col-lg-pull-0');
    });
});

describe('getRowClassName', () => {
    it('非 flex 时带基础类名', () => {
        expect(getRowClassName('semi', {}, 'x')).toBe('semi-row x');
    });

    it('flex 时没有基础类名，justify 与 align 追加类名', () => {
        expect(getRowClassName('semi', { type: 'flex', justify: 'center', align: 'middle' })).toBe('semi-row-flex semi-row-flex-center semi-row-flex-middle');
    });
});
