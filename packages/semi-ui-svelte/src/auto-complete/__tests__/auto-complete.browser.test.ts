import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { clickOutside } from '@test/utils/browser';
import type { AutoCompleteItems, AutoCompleteProps } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import AutoCompleteCase from './auto-complete-case.svelte';

const getPopupWrapper = () => document.querySelector<HTMLElement>('.semi-popover-wrapper');
const getInput = () => screen.getByRole<HTMLInputElement>('combobox');
const getClearButton = () => document.querySelector<HTMLElement>('.semi-input-clearbtn') as HTMLElement;

// an email-domain suggester: the data follows what is typed
function setup(props: Omit<AutoCompleteProps, 'value' | 'data'> = {}, data: AutoCompleteItems[] = []) {
    const store = createStore<{ value?: string | number; accept: boolean; log: string[]; data: AutoCompleteItems[] }>({ value: '', accept: true, log: [], data });
    const onSearch = (input: string) => {
        store.data = input ? ['gmail.com', '163.com', 'qq.com'].map((domain) => `${input}@${domain}`) : [];
    };
    render(AutoCompleteCase, { props: { mode: 'bind', store, props: { style: 'width: 300px', onSearch, showClear: true, ...props } } });
    flushSync();
    return { store };
}

describe('Svelte AutoComplete 浏览器', () => {
    it('加载态面板由内边距和 Spin 撑开，Spin 不溢出面板', async () => {
        setup({ loading: true });
        await userEvent.click(getInput());
        const wrapper = await waitFor(() => {
            const element = document.querySelector<HTMLElement>('.semi-autocomplete-loading-wrapper');
            expect(element).not.toBeNull();
            return element as HTMLElement;
        });
        const spin = wrapper.querySelector('.semi-spin') as HTMLElement;
        const { top, bottom } = wrapper.getBoundingClientRect();
        const style = getComputedStyle(wrapper);
        expect(spin.getBoundingClientRect().bottom).toBeLessThanOrEqual(bottom - parseFloat(style.paddingBottom));
        expect(spin.getBoundingClientRect().top).toBeGreaterThanOrEqual(top + parseFloat(style.paddingTop));
    });

    it('键盘：输入后 Enter 关闭，方向键与 Enter 选中，Escape 保留输入', async () => {
        setup();
        const input = getInput();
        await userEvent.tab();
        expect(input).toHaveFocus();

        await userEvent.keyboard('123');
        await waitFor(() => expect(document.querySelector('.semi-popover')).not.toBeNull());
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.querySelector('.semi-popover')).toBeNull());
        expect(input).toHaveValue('123');

        await userEvent.keyboard('{Enter}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowUp}{Escape}');
        expect(input).toHaveValue('123');

        await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await waitFor(() => expect(input).toHaveValue('123@gmail.com'));

        await userEvent.keyboard('{ArrowUp}{ArrowUp}{Enter}');
        await waitFor(() => expect(input).toHaveValue('123@qq.com'));

        await userEvent.hover(input);
        await userEvent.click(getClearButton());
        await clickOutside();
        expect(input).toHaveValue('');
    });

    it('鼠标悬停候选项后方向键从它继续', async () => {
        setup();
        const input = getInput();
        await userEvent.click(input);
        await userEvent.keyboard('123');
        await userEvent.hover(await screen.findByText('123@163.com'));
        await userEvent.keyboard('{ArrowDown}{Enter}');
        await waitFor(() => expect(input).toHaveValue('123@qq.com'));
    });

    it('鼠标点击清除按钮不先打开再关闭列表', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const { store } = setup({ onDropdownVisibleChange }, ['semi', 'design']);
        store.value = 'semi';
        flushSync();
        const input = getInput();
        await userEvent.hover(input);
        await userEvent.click(getClearButton());
        expect(input).toHaveValue('');
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        expect(document.querySelector('.semi-popover')).not.toBeNull();
    });

    it('下拉宽度不小于触发器宽度', async () => {
        setup();
        await userEvent.click(getInput());
        await userEvent.keyboard('1');
        await screen.findByText('1@163.com');
        const trigger = document.querySelector<HTMLElement>('.semi-autocomplete') as HTMLElement;
        // offsetWidth ignores the enter animation's scale transform
        expect((getPopupWrapper() as HTMLElement).offsetWidth).toBeGreaterThanOrEqual(trigger.offsetWidth);
    });

    it('鼠标点选候选项后焦点留在输入框，不发出 onBlur', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        setup({ onBlur });
        const input = getInput();
        await userEvent.click(input);
        await userEvent.keyboard('123');
        await userEvent.click(await screen.findByText('123@163.com'));
        await waitFor(() => expect(input).toHaveValue('123@163.com'));
        expect(input).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });
});
