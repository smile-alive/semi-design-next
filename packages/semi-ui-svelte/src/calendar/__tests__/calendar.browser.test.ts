import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { CalendarProps, EventObject } from '../interface';
import CalendarBrowser from './calendar-browser.svelte';

const prefix = 'semi-calendar';
const day = new Date(2019, 7, 8);
const event = (key: string, start: Date, end?: Date): EventObject => ({ key, start, end, children: key });

function setup(props: CalendarProps, hidden = false) {
    const store = createStore<{ hidden: boolean; props: CalendarProps }>({ hidden, props });
    const view = render(CalendarBrowser, { props: { store } });
    return { store, container: view.container };
}

describe('Svelte Calendar 浏览器', () => {
    it('month 视图按真实行高折叠事件，折叠数量与列表一致', async () => {
        const events = Array.from({ length: 8 }, (_, i) => event(`e${i}`, new Date(2019, 7, 8, 9 + i)));
        const { container } = setup({ displayValue: day, events, height: 600, mode: 'month' });
        const more = await screen.findByRole('button', { name: /还有\d+项/ });
        const hidden = Number(/\d+/.exec(more.textContent ?? '')?.[0]);
        const shown = container.querySelectorAll(`.${prefix}-event-month`).length;
        expect(hidden).toBeGreaterThan(0);
        expect(shown + hidden).toBe(8);
    });

    it('Tab 从前一个按钮一次到达 "更多"，Enter 打开卡片并聚焦关闭按钮，Esc 关闭并把焦点还给 "更多"', async () => {
        setup({ displayValue: day, events: [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10)), event('c', new Date(2019, 7, 8, 11)), event('d', new Date(2019, 7, 8, 12)), event('e', new Date(2019, 7, 8, 13)), event('f', new Date(2019, 7, 8, 14))], height: 300, mode: 'month' });
        const more = await screen.findByRole('button', { name: /还有\d+项/ });
        screen.getByRole('button', { name: 'before' }).focus();
        await userEvent.tab();
        expect(more).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        const close = await screen.findByRole('button', { name: '关闭' });
        await waitFor(() => expect(close).toHaveFocus());
        expect(more).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(more).toHaveFocus());
        expect(more).toHaveAttribute('aria-expanded', 'false');
        await waitFor(() => expect(document.querySelector(`.${prefix}-month-event-card`)).toBeNull());
    });

    it('点击关闭按钮后焦点回到 "更多"', async () => {
        setup({ displayValue: day, events: [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10)), event('c', new Date(2019, 7, 8, 11)), event('d', new Date(2019, 7, 8, 12)), event('e', new Date(2019, 7, 8, 13)), event('f', new Date(2019, 7, 8, 14))], height: 300, mode: 'month' });
        const more = await screen.findByRole('button', { name: /还有\d+项/ });
        await userEvent.click(more);
        await userEvent.click(await screen.findByRole('button', { name: '关闭' }));
        await waitFor(() => expect(more).toHaveFocus());
    });

    it.each(['day', 'week'] as const)('%s 视图的根元素是 Tab 停靠点并显示主题焦点环', async (mode) => {
        const { container } = setup({ displayValue: day, mode });
        const root = container.querySelector(`.${prefix}-${mode}`) as HTMLElement;
        await tabTo(root);
        expectThemeFocusRing(root);
    });

    it('隐藏挂载后变为可见：重新定位事件与当前时间线，并应用 scrollTop', async () => {
        const { container, store } = setup({ displayValue: day, events: [event('a', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 11))], mode: 'day', scrollTop: 300 }, true);
        const item = () => container.querySelector<HTMLElement>(`.${prefix}-event-day`) as HTMLElement;
        expect(parseFloat(item().style.top)).toBe(0);
        store.hidden = false;
        await waitFor(() => expect(parseFloat(item().style.top)).toBeGreaterThan(0));
        const root = container.querySelector(`.${prefix}-day`) as HTMLElement;
        await waitFor(() => expect(root.scrollTop).toBeGreaterThan(0));
    });
});
