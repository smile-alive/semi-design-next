import { flushSync } from 'svelte';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { clickOutside, mouse } from '@test/utils/browser';
import type { SelectOptionProps, SelectProps, SelectValue } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import SelectCase from './select-case.svelte';

const optionList: SelectOptionProps[] = [
    { value: 'abc', label: 'Abc' },
    { value: 'hotsoon', label: 'Hotsoon', disabled: true },
    { value: 'pipixia', label: 'Pipixia' },
    { value: 'toutiao', label: 'TopBuzz' },
];

function setup(props: Omit<SelectProps, 'value' | 'optionList'> = {}) {
    const store = createStore<{ value?: SelectValue; accept: boolean; log: string[]; optionList: SelectOptionProps[] }>({ value: undefined, accept: true, log: [], optionList });
    render(SelectCase, { props: { mode: 'bind', store, props } });
    flushSync();
    return { store, combobox: screen.getByRole('combobox', { name: 'Fruit' }) };
}

const active = (combobox: HTMLElement) => document.getElementById(combobox.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();

describe('Svelte Select 浏览器：select-only combobox（APG）', () => {
    it('ArrowDown 打开并移动，Home、End 到首尾可用项，Enter 选中并关闭，焦点留在 combobox', async () => {
        const { store, combobox } = setup();
        await userEvent.tab();
        expect(combobox).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('listbox');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(active(combobox)).toBe('Abc');
        // the disabled option is skipped
        await userEvent.keyboard('{ArrowDown}');
        expect(active(combobox)).toBe('Pipixia');
        await userEvent.keyboard('{End}');
        expect(active(combobox)).toBe('TopBuzz');
        await userEvent.keyboard('{Home}');
        expect(active(combobox)).toBe('Abc');
        await userEvent.keyboard('{End}{Enter}');
        await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
        expect(store.value).toBe('toutiao');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        expect(combobox).not.toHaveAttribute('aria-activedescendant');
        expect(combobox).toHaveFocus();
    });

    it('关闭时 ArrowUp 打开，Escape 关闭且焦点留在 combobox', async () => {
        const onBlur = vi.fn<(event: FocusEvent | MouseEvent) => void>();
        const { combobox } = setup({ onBlur });
        combobox.focus();
        await userEvent.keyboard('{ArrowUp}');
        await screen.findByRole('listbox');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
        expect(combobox).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('按字符移到以它开头的选项，关闭时先打开', async () => {
        const { combobox } = setup();
        combobox.focus();
        await userEvent.keyboard('t');
        await screen.findByRole('listbox');
        expect(active(combobox)).toBe('TopBuzz');
    });

    it('打开时按 Tab 关闭列表并离开，发出一次 onBlur', async () => {
        const onBlur = vi.fn<(event: FocusEvent | MouseEvent) => void>();
        const { combobox } = setup({ onBlur });
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('listbox');
        await userEvent.tab();
        await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
        expect(combobox).not.toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('指针点选选项后关闭，焦点留在 combobox', async () => {
        const { store, combobox } = setup();
        await userEvent.click(combobox);
        await screen.findByRole('listbox');
        await userEvent.click(screen.getByRole('option', { name: 'Pipixia' }));
        await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
        expect(store.value).toBe('pipixia');
        expect(combobox).toHaveFocus();
    });

    it('按住选项时焦点留在 combobox', async () => {
        const { combobox } = setup();
        await userEvent.click(combobox);
        await screen.findByRole('listbox');
        const { left, top, width, height } = screen.getByRole('option', { name: 'Pipixia' }).getBoundingClientRect();
        await mouse('move', left + width / 2, top + height / 2);
        await mouse('down', left + width / 2, top + height / 2);
        expect(combobox).toHaveFocus();
        await mouse('up', left + width / 2, top + height / 2);
    });

    it('点击外部关闭列表', async () => {
        const { combobox } = setup();
        await userEvent.click(combobox);
        await screen.findByRole('listbox');
        await clickOutside();
        await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
    });
});

describe('Svelte Select 浏览器：可搜索 combobox', () => {
    it('触发器内的搜索框是 combobox，输入后 aria-activedescendant 指向首个匹配项，Enter 选中', async () => {
        const { store } = setup({ filter: true });
        await userEvent.click(document.querySelector('.semi-select') as HTMLElement);
        const input = await screen.findByRole('combobox', { name: 'Fruit' });
        expect(input.tagName).toBe('INPUT');
        await waitFor(() => expect(input).toHaveFocus());
        await userEvent.keyboard('pi');
        await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
        expect(active(input)).toBe('Pipixia');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(store.value).toBe('pipixia'));
    });
});

describe('Svelte Select 浏览器：分组', () => {
    const fruits = { key: 'fruits', label: 'Fruits' };
    const vegetables = { key: 'vegetables', label: 'Vegetables' };
    const groupedList: SelectOptionProps[] = [
        { value: 'apple', label: 'Apple', group: fruits },
        { value: 'banana', label: 'Banana', group: fruits },
        { value: 'carrot', label: 'Carrot', group: vegetables },
        { value: 'leek', label: 'Leek', group: vegetables },
    ];

    const setupGrouped = (props: Omit<SelectProps, 'value' | 'optionList'> = {}) => {
        const store = createStore<{ value?: SelectValue; accept: boolean; log: string[]; optionList: SelectOptionProps[] }>({ value: undefined, accept: true, log: [], optionList: groupedList });
        render(SelectCase, { props: { mode: 'bind', store, props } });
        flushSync();
        return { store, combobox: screen.getByRole('combobox', { name: 'Fruit' }) };
    };

    it('可访问树里选项归属到命名的 group，方向键跨组移动', async () => {
        const { store, combobox } = setupGrouped();
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('listbox');
        const fruitsGroup = screen.getByRole('group', { name: 'Fruits' });
        const vegetablesGroup = screen.getByRole('group', { name: 'Vegetables' });
        expect(within(fruitsGroup).getAllByRole('option')).toHaveLength(2);
        expect(within(vegetablesGroup).getAllByRole('option')).toHaveLength(2);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(active(combobox)).toBe('Carrot');
        expect(within(vegetablesGroup).getByRole('option', { name: 'Carrot' })).toHaveAttribute('id', combobox.getAttribute('aria-activedescendant'));
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(store.value).toBe('carrot'));
    });

    it('搜索后空组隐藏', async () => {
        setupGrouped({ filter: true });
        await userEvent.click(document.querySelector('.semi-select') as HTMLElement);
        await screen.findByRole('listbox');
        await userEvent.keyboard('lee');
        await waitFor(() => expect(screen.getAllByRole('group')).toHaveLength(1));
        expect(screen.getByRole('group', { name: 'Vegetables' })).toBeInTheDocument();
        expect(screen.getAllByRole('option')).toHaveLength(1);
    });
});
