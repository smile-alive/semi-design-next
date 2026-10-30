import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { clickOutside } from '@test/utils/browser';
import type { TreeSelectProps, TreeSelectValue } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import { getRows, optionCls, treeData } from './data';
import TreeSelectCase from './tree-select-case.svelte';

function setup(props: Omit<TreeSelectProps, 'value' | 'expandedKeys'> = {}) {
    const store = createStore<{ value?: TreeSelectValue; expandedKeys?: string[]; accept: boolean; log: string[] }>({ value: undefined, expandedKeys: undefined, accept: true, log: [] });
    render(TreeSelectCase, { props: { mode: 'bind', store, props: { treeData, ...props } } });
    flushSync();
    return { store, combobox: screen.getByRole('combobox', { name: 'Region' }) };
}

const active = (combobox: HTMLElement) => document.getElementById(combobox.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();
const closed = () => waitFor(() => expect(screen.queryByRole('tree')).toBe(null));

describe('Svelte TreeSelect 浏览器：select-only combobox（APG）', () => {
    it('ArrowDown 打开并移动，ArrowRight 展开，Enter 选中并关闭，焦点留在 combobox', async () => {
        const { store, combobox } = setup();
        await userEvent.tab();
        expect(combobox).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('tree');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{ArrowDown}');
        expect(active(combobox)).toBe('亚洲');
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(getRows().map((row) => row.textContent?.trim())).toContain('中国'));
        await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}');
        expect(active(combobox)).toBe('北京');
        await userEvent.keyboard('{Enter}');
        await closed();
        expect(store.value).toBe('Beijing');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        expect(combobox).not.toHaveAttribute('aria-activedescendant');
        expect(combobox).toHaveFocus();
    });

    it('Escape 关闭且焦点留在 combobox，不发 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        const { combobox } = setup({ onBlur });
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('tree');
        await userEvent.keyboard('{Escape}');
        await closed();
        expect(combobox).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('打开时按 Tab 关闭下拉并离开，发出一次 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        const { combobox } = setup({ onBlur });
        const after = document.createElement('button');
        document.body.append(after);
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('tree');
        await userEvent.tab();
        await closed();
        expect(combobox).not.toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
        after.remove();
    });

    it('指针点选叶子后关闭，焦点留在 combobox', async () => {
        const { store, combobox } = setup({ defaultExpandAll: true });
        await userEvent.click(combobox);
        await screen.findByRole('tree');
        await userEvent.click(screen.getByRole('treeitem', { name: '美国' }));
        await closed();
        expect(store.value).toBe('Meiguo');
        expect(combobox).toHaveFocus();
    });

    it('点击外部关闭下拉', async () => {
        const { combobox } = setup();
        await userEvent.click(combobox);
        await screen.findByRole('tree');
        await clickOutside();
        await waitFor(() => expect(screen.queryByRole('tree')).toBe(null));
    });
});

describe('Svelte TreeSelect 浏览器：搜索框 combobox', () => {
    it('触发器内的搜索框是 combobox，打开后保持焦点，输入过滤，Enter 选中激活行', async () => {
        const { store } = setup({ filterTreeNode: true, searchPosition: 'trigger', showFilteredOnly: true });
        const input = screen.getByRole('combobox', { name: 'Region' });
        expect(input.tagName).toBe('INPUT');
        await userEvent.click(input);
        await screen.findByRole('tree');
        expect(input).toHaveFocus();
        await userEvent.keyboard('美国');
        await waitFor(() => expect(getRows().map((row) => row.textContent?.trim())).toEqual(['北美洲', '美国']));
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await waitFor(() => expect(store.value).toBe('Meiguo'));
    });

    it('下拉里的搜索框在 searchAutoFocus 时于打开后拿到焦点', async () => {
        setup({ filterTreeNode: true, searchAutoFocus: true });
        await userEvent.click(screen.getByRole('combobox', { name: 'Region' }));
        const input = await screen.findByRole('textbox');
        await waitFor(() => expect(input).toHaveFocus());
    });
});

describe('Svelte TreeSelect 浏览器：虚拟化', () => {
    it('只渲染视口内的行，滚动后换行', async () => {
        const many = Array.from({ length: 200 }, (_, i) => ({ label: `Node ${i}`, value: `${i}`, key: `${i}` }));
        setup({ treeData: many, defaultOpen: true, virtualize: { height: 150, width: 240, itemSize: 30 } });
        await screen.findByRole('tree');
        const first = () => getRows()[0]?.textContent?.trim();
        await waitFor(() => expect(getRows().length).toBeGreaterThan(0));
        expect(getRows().length).toBeLessThan(30);
        expect(first()).toBe('Node 0');
        const list = document.querySelector<HTMLElement>(`.${optionCls}`)?.closest<HTMLElement>('[style*="overflow"], .semi-tree-option-list') ?? undefined;
        const scroller = [...document.querySelectorAll<HTMLElement>('.semi-tree-select-popover *')].find((element) => element.scrollHeight > element.clientHeight + 100) ?? list;
        expect(scroller).toBeDefined();
        (scroller as HTMLElement).scrollTop = 3000;
        await waitFor(() => expect(first()).not.toBe('Node 0'));
    });
});
