import { describe, expect, it } from 'vite-plus/test';
import { groupRole, isLabelled } from '../group-role';

describe('groupRole', () => {
    it('只有 aria-label 时为 group', () => {
        expect(groupRole({ 'aria-label': 'name' })).toBe('group');
    });

    it('只有 aria-labelledby 时为 group', () => {
        expect(groupRole({ 'aria-labelledby': 'id' })).toBe('group');
    });

    it('显式 role 优先于 group', () => {
        expect(groupRole({ 'aria-label': 'name', role: 'region' })).toBe('region');
    });

    it('没有可访问名称时无 role', () => {
        expect(groupRole({})).toBeUndefined();
        expect(isLabelled({ 'aria-label': '' })).toBe(false);
    });
});
