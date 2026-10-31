import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { TreeValue } from '../interface';
import { click, collapsedCls, getExpandIcon, getNode, selectedCls } from './data';
import TreeModes from './tree-modes.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

function setup(mode: Mode, init: { value?: TreeValue; expandedKeys?: string[]; accept?: boolean; multiple?: boolean } = {}) {
    const store = createStore<{ value: TreeValue | undefined; expandedKeys: string[] | undefined; accept: boolean; log: string[] }>({ value: init.value, expandedKeys: init.expandedKeys, accept: init.accept ?? true, log: [] });
    render(TreeModes, { props: { mode, store, multiple: init.multiple } });
    return store;
}

const isSelected = (key: string) => getNode(key).classList.contains(selectedCls);
const isExpanded = (key: string) => !getNode(key).classList.contains(collapsedCls);

describe('Svelte Tree 受控 value（$bindable）', () => {
    it('非受控：点击选中，onChange 收到值', async () => {
        const store = setup('uncontrolled');
        await click(getNode('yazhou'));
        expect(isSelected('yazhou')).toBe(true);
        await click(getNode('beimeizhou'));
        expect(isSelected('beimeizhou')).toBe(true);
        expect(isSelected('yazhou')).toBe(false);
        expect(store.log).toEqual(['change Yazhou', 'change Beimeizhou']);
    });

    it('bind:value：点击写回父级，父级改值同步到组件，重置为 undefined 后清空选中', async () => {
        const store = setup('bind', { value: 'Yazhou' });
        expect(isSelected('yazhou')).toBe(true);
        await click(getNode('beimeizhou'));
        expect(store.value).toBe('Beimeizhou');
        expect(isSelected('beimeizhou')).toBe(true);
        store.value = 'Yazhou';
        flushSync();
        expect(isSelected('yazhou')).toBe(true);
        store.value = undefined;
        flushSync();
        expect(isSelected('yazhou')).toBe(false);
    });

    it('bind:value 初值为 undefined：点击后父级拿到值，父级再改值时组件跟随', async () => {
        const store = setup('bind');
        await click(getNode('yazhou'));
        expect(store.value).toBe('Yazhou');
        expect(isSelected('yazhou')).toBe(true);
        store.value = 'Beimeizhou';
        flushSync();
        expect(isSelected('beimeizhou')).toBe(true);
        expect(isSelected('yazhou')).toBe(false);
    });

    it('bind:value 初值为 undefined：点选后父级改回 undefined，单选清空选中', async () => {
        const store = setup('bind');
        await click(getNode('yazhou'));
        expect(isSelected('yazhou')).toBe(true);
        store.value = undefined;
        flushSync();
        expect(isSelected('yazhou')).toBe(false);
    });

    it('bind:value 初值为 undefined：勾选后父级改回 undefined，多选清空勾选', async () => {
        const store = setup('bind', { multiple: true });
        await click(getNode('beimeizhou'));
        expect(getNode('beimeizhou')).toHaveAttribute('aria-checked', 'true');
        store.value = undefined;
        flushSync();
        expect(getNode('beimeizhou')).toHaveAttribute('aria-checked', 'false');
    });

    it('函数绑定：setter 拒绝时组件保持原值', async () => {
        const store = setup('function', { value: 'Yazhou', accept: false });
        await click(getNode('beimeizhou'));
        expect(store.log).toEqual(['set Beimeizhou', 'change Beimeizhou']);
        expect(store.value).toBe('Yazhou');
        expect(isSelected('yazhou')).toBe(true);
        expect(isSelected('beimeizhou')).toBe(false);
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const store = setup('function', { value: 'Yazhou' });
        await click(getNode('beimeizhou'));
        expect(store.value).toBe('Beimeizhou');
        expect(isSelected('beimeizhou')).toBe(true);
    });

    it('单向传值：组件在本地覆盖，父级值不变；父级再推值时覆盖本地', async () => {
        const store = setup('one-way', { value: 'Yazhou' });
        await click(getNode('beimeizhou'));
        expect(store.value).toBe('Yazhou');
        expect(isSelected('beimeizhou')).toBe(true);
        store.value = 'Beimeizhou';
        flushSync();
        store.value = 'Yazhou';
        flushSync();
        expect(isSelected('yazhou')).toBe(true);
        expect(isSelected('beimeizhou')).toBe(false);
    });
});

describe('Svelte Tree 受控 expandedKeys（$bindable）', () => {
    it('非受控：点击箭头展开与收起，onExpand 收到展开的 key', async () => {
        const store = setup('uncontrolled');
        await click(getExpandIcon(getNode('yazhou')));
        expect(isExpanded('yazhou')).toBe(true);
        await click(getExpandIcon(getNode('yazhou')));
        expect(isExpanded('yazhou')).toBe(false);
        expect(store.log).toEqual(['expand yazhou', 'expand ']);
    });

    it('bind:expandedKeys：展开写回父级，父级改值同步到组件', async () => {
        const store = setup('bind', { expandedKeys: ['yazhou'] });
        expect(isExpanded('yazhou')).toBe(true);
        await click(getExpandIcon(getNode('beimeizhou')));
        expect(store.expandedKeys).toEqual(['yazhou', 'beimeizhou']);
        expect(isExpanded('beimeizhou')).toBe(true);
        store.expandedKeys = [];
        flushSync();
        expect(isExpanded('yazhou')).toBe(false);
        expect(isExpanded('beimeizhou')).toBe(false);
    });

    it('bind:expandedKeys 初值为 undefined：展开后父级拿到 key，父级再改值时组件跟随', async () => {
        const store = setup('bind');
        await click(getExpandIcon(getNode('yazhou')));
        expect(store.expandedKeys).toEqual(['yazhou']);
        expect(isExpanded('yazhou')).toBe(true);
        store.expandedKeys = ['beimeizhou'];
        flushSync();
        expect(isExpanded('yazhou')).toBe(false);
        expect(isExpanded('beimeizhou')).toBe(true);
    });

    it('函数绑定：setter 拒绝时保持收起', async () => {
        const store = setup('function', { expandedKeys: ['yazhou'], accept: false });
        await click(getExpandIcon(getNode('beimeizhou')));
        expect(store.log).toEqual(['set keys yazhou,beimeizhou', 'expand yazhou,beimeizhou']);
        expect(store.expandedKeys).toEqual(['yazhou']);
        expect(isExpanded('beimeizhou')).toBe(false);
        expect(isExpanded('yazhou')).toBe(true);
    });

    it('函数绑定：setter 接受时展开', async () => {
        const store = setup('function', { expandedKeys: ['yazhou'] });
        await click(getExpandIcon(getNode('beimeizhou')));
        expect(store.expandedKeys).toEqual(['yazhou', 'beimeizhou']);
        expect(isExpanded('beimeizhou')).toBe(true);
    });

    it('单向传值：组件在本地展开，父级值不变；父级再推值时覆盖本地', async () => {
        const store = setup('one-way', { expandedKeys: ['yazhou'] });
        await click(getExpandIcon(getNode('beimeizhou')));
        expect(store.expandedKeys).toEqual(['yazhou']);
        expect(isExpanded('beimeizhou')).toBe(true);
        store.expandedKeys = [];
        flushSync();
        expect(isExpanded('yazhou')).toBe(false);
        expect(isExpanded('beimeizhou')).toBe(false);
    });
});
