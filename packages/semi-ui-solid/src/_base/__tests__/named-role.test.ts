import { describe, expect, it } from 'vite-plus/test';
import { namedRole } from '../named-role';

describe('namedRole', () => {
    it('有 aria-label 或 aria-labelledby 时为 group，没有名称时不加角色', () => {
        expect(namedRole(undefined, 'a', undefined)).toBe('group');
        expect(namedRole(undefined, undefined, 'id')).toBe('group');
        expect(namedRole(undefined, undefined, undefined)).toBeUndefined();
        expect(namedRole(undefined, '', undefined)).toBeUndefined();
    });

    it('使用方传入的 role 优先', () => {
        expect(namedRole('region', 'a', undefined)).toBe('region');
        expect(namedRole('toolbar', undefined, undefined)).toBe('toolbar');
    });
});
