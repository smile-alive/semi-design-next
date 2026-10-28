import { describe, expect, it } from 'vite-plus/test';
import { namedRole } from '../named-role';

describe('namedRole', () => {
    it('有 aria-label 或 aria-labelledby 时为 group，没有名称时不加角色', () => {
        expect(namedRole({ 'aria-label': 'a' })).toBe('group');
        expect(namedRole({ 'aria-labelledby': 'id' })).toBe('group');
        expect(namedRole({})).toBeUndefined();
        expect(namedRole({ 'aria-label': '' })).toBeUndefined();
    });

    it('使用方传入的 role 优先', () => {
        expect(namedRole({ role: 'region', 'aria-label': 'a' })).toBe('region');
        expect(namedRole({ role: 'toolbar' })).toBe('toolbar');
    });
});
