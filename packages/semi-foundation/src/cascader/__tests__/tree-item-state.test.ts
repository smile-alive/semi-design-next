import { describe, expect, it } from 'vite-plus/test';
import CascaderFoundation from '../foundation';

function sets(overrides: Partial<Record<string, string[]>> = {}) {
    const names = ['activeKeys', 'selectedKeys', 'loadedKeys', 'loadingKeys', 'checkedKeys', 'halfCheckedKeys'];
    return Object.fromEntries(names.map((name) => [name, new Set(overrides[name] ?? [])])) as Record<(typeof names)[number], Set<string>>;
}

describe('CascaderFoundation.getTreeItemState', () => {
    it('shows an active and selected option as selected only', () => {
        const state = CascaderFoundation.getTreeItemState('a', sets({ activeKeys: ['a'], selectedKeys: ['a'] }), false, true);
        expect(state).toMatchObject({ showActive: false, showSelected: true, aria: { 'aria-selected': true, 'aria-expanded': true } });
    });

    it('never marks a row selected in multiple mode and reports the check state', () => {
        const half = CascaderFoundation.getTreeItemState('a', sets({ selectedKeys: ['a'], halfCheckedKeys: ['a'], checkedKeys: ['a'] }), true, false);
        expect(half).toMatchObject({ showSelected: false, aria: { 'aria-checked': 'mixed', 'aria-selected': undefined, 'aria-expanded': undefined } });
        expect(CascaderFoundation.getTreeItemState('a', sets(), true, false).aria['aria-checked']).toBe(false);
    });

    it('is busy only while loading has not finished', () => {
        expect(CascaderFoundation.getTreeItemState('a', sets({ loadingKeys: ['a'] }), false, true).aria['aria-busy']).toBe(true);
        expect(CascaderFoundation.getTreeItemState('a', sets({ loadingKeys: ['a'], loadedKeys: ['a'] }), false, true).aria['aria-busy']).toBeUndefined();
    });
});
