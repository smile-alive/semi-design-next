import { flushSync } from 'svelte';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture, { type FixtureStore } from './time-picker-fixture.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-timepicker`;

type SetupInit = Partial<Omit<FixtureStore, 'props'>> & { props?: FixtureStore['props'] };

function setup({ props, ...init }: SetupInit = {}) {
    const store = createStore<FixtureStore>({ target: 'value', mode: init.value === undefined ? 'uncontrolled' : 'one-way', accept: true, log: [], ...init, props: { scrollItemProps: { cycled: false }, ...props } });
    render(Fixture, { props: { store } });
    flushSync();
    return store;
}

const getPanel = () => document.querySelector(`.${prefixCls}-panel`);
const getList = (unit: string, index = 0) => document.querySelectorAll<HTMLElement>(`.${prefixCls}-panel-list-${unit}`)[index];
const selectedText = (unit: string, index = 0) => getList(unit, index).querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)?.textContent?.trim();

async function clickItem(unit: string, text: string, index = 0) {
    await waitFor(() => expect(getList(unit, index)).toBeDefined());
    await userEvent.click(within(getList(unit, index)).getByText(text));
}

describe('Svelte TimePicker 浏览器', () => {
    it('点击输入框打开面板，依次选择时、分、秒', async () => {
        const store = setup({ props: { type: 'timeRange' } });
        const input = screen.getByRole<HTMLInputElement>('combobox');
        await userEvent.click(input);
        await clickItem('hour', '23');
        await clickItem('minute', '59');
        await clickItem('second', '59');
        await waitFor(() => expect(selectedText('second')).toBe('59秒'));
        expect(selectedText('hour')).toBe('23时');
        expect(selectedText('minute')).toBe('59分');
        expect(input.value).toMatch(/^23:59:59 ~ $/);
        expect(store.log.filter((entry) => entry.startsWith('change'))).toHaveLength(3);
    });

    it('12 小时制下切换上下午与小时', async () => {
        setup({ value: ['上午 10:12', '上午 11:08'], props: { type: 'timeRange', format: 'a hh:mm', use12Hours: true, disabledHours: () => [1, 2, 4, 8, 16] } });
        await userEvent.click(screen.getByRole('combobox'));
        for (const [ampm, hour, minute] of [
            ['下午', '09', '09'],
            ['上午', '10', '10'],
        ]) {
            await clickItem('ampm', ampm);
            await clickItem('hour', hour);
            await clickItem('minute', minute);
            await waitFor(() => expect(selectedText('ampm')).toBe(ampm));
            expect(selectedText('hour')).toBe(`${hour}时`);
            expect(selectedText('minute')).toBe(`${minute}分`);
        }
    });

    it('悬停后点击清除按钮清空', async () => {
        setup({ value: ['10:11:12', '12:11:23'], props: { type: 'timeRange' } });
        const input = screen.getByRole('combobox');
        await userEvent.click(input);
        await userEvent.hover(input);
        await userEvent.click(screen.getByRole('button', { name: '清空输入' }));
        expect(input).toHaveValue('');
    });

    it('键入后点击外部，非法文本恢复为上一个有效时间', async () => {
        setup({ value: '10:24:18', open: true });
        const input = screen.getByRole('combobox');
        const outside = screen.getByRole('button', { name: 'outside' });
        await userEvent.click(input);
        await userEvent.type(input, '1');
        expect(input).not.toHaveValue('10:24:18');
        await userEvent.click(outside);
        await waitFor(() => expect(input).toHaveValue('10:24:18'));
    });

    it('ArrowDown 从输入框进入小时列表，Tab 在列间移动，Esc 关闭面板并回到输入框', async () => {
        const store = setup({ props: { motion: false } });
        const input = screen.getByRole('combobox');
        await userEvent.click(input);
        await waitFor(() => expect(getPanel()).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('listbox', { name: '小时' })).toHaveFocus());
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('listbox', { name: '分钟' })).toHaveFocus();
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('listbox', { name: '秒' })).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPanel()).toBeNull());
        // fixed wait: covers the focus handler and Tooltip's positioning fallback
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(getPanel()).toBeNull();
        expect(input).toHaveFocus();
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(store.log.filter((entry) => entry.startsWith('blur'))).toEqual([]);
    });

    it('列表内方向键选择相邻项', async () => {
        const store = setup({ value: '10:24:18', props: { motion: false } });
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(getPanel()).not.toBeNull());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('listbox', { name: '小时' })).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(selectedText('hour')).toBe('11时'));
        expect(screen.getByRole('combobox')).toHaveValue('11:24:18');
        expect(store.log.filter((entry) => entry.startsWith('change'))).toEqual(['change 11:24:18 "11:24:18"']);
    });

    it('自定义触发器打开面板，点击外部关闭', async () => {
        setup({ value: '10:24:18', trigger: 'button' });
        await userEvent.click(screen.getByRole('button', { name: '10:24:18' }));
        await waitFor(() => expect(getPanel()).not.toBeNull());
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        await waitFor(() => expect(getPanel()).toBeNull());
    });

    it('只有文本的自定义触发器经 Tab 聚焦，Enter 打开面板', async () => {
        setup({ trigger: 'text', props: { motion: false } });
        await userEvent.tab();
        const wrapper = screen.getByRole('button', { name: '请选择时间' });
        expect(wrapper).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getPanel()).not.toBeNull());
        expect(wrapper).toHaveAttribute('aria-expanded', 'true');
    });
});
