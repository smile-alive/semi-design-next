import { describe, expect, it } from 'vite-plus/test';
import { omitInstanceIds } from '../constants';

describe('omitInstanceIds', () => {
    it('去掉实例级 id，保留其他默认值', () => {
        const defaults = { id: 'a', insetLabelId: 'b', wrapperId: 'c', addonId: 'd', extraId: 'e', size: 'large' };
        expect(omitInstanceIds(defaults)).toEqual({ size: 'large' });
    });

    it('未设置时返回空对象', () => {
        expect(omitInstanceIds(undefined)).toEqual({});
    });
});
