/** @jsxImportSource vue */
import { createApp } from 'vue';
import { screen, waitFor, within } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render, sleep } from '@test/utils/vue';
import ScrollList, { ScrollItem, type ScrollItemSelectData } from '..';
import Controlled from './fixtures/controlled.vue';

const prefix = `${BASE_CLASS_PREFIX}-scrolllist`;
const list = Array.from({ length: 20 }, (_, index) => ({ value: index }));

describe('scrollList', () => {
    it('暗色模式下阴影跟随 --semi-shadow-elevated', () => {
        document.body.setAttribute('theme-mode', 'dark');
        onTestFinished(() => document.body.removeAttribute('theme-mode'));
        const { container } = render(Controlled);
        expect(getComputedStyle(container.querySelector(`.${prefix}`) as Element).boxShadow).toContain('inset');
    });

    it('normal 与 wheel 列不显示滚动条', () => {
        const { container } = render(ScrollList, {
            props: { header: 'hello world' },
            slots: {
                default: () => [<ScrollItem aria-label="normal" list={list} mode="normal" selectedIndex={1} />, <ScrollItem aria-label="wheel" list={list} mode="wheel" selectedIndex={1} />],
            },
        });
        const scrollers = container.querySelectorAll<HTMLElement>(`.${prefix}-item, .${prefix}-item-wheel .${prefix}-list-outer`);
        expect(scrollers).toHaveLength(2);
        // headless Chromium draws overlay scrollbars that take no width, so the computed property is what can be checked
        for (const scroller of scrollers) {
            expect(getComputedStyle(scroller).scrollbarWidth).toBe('none');
        }
    });

    it('点击后滚动到指定位置', async () => {
        const { container } = render(Controlled);
        const selected = () => container.querySelector(`.${prefix}-item-sel`);
        expect(selected()).toMatchTextContent(/^1$/);

        await userEvent.click(within(screen.getByRole('listbox')).getByText(/^5$/));
        await waitFor(() => expect(selected()).toMatchTextContent(/^5$/));
    });

    it.each([false, true])('wheel 列在 motion=%s 时挂载后，选中项带选中高亮类', async (motion) => {
        const { container } = render(ScrollList, {
            props: { header: 'wheel' },
            slots: {
                default: () => <ScrollItem aria-label="wheel" list={list} mode="wheel" motion={motion} selectedIndex={5} />,
            },
        });
        await waitFor(() => {
            const highlighted = container.querySelectorAll(`.${prefix}-item-selected`);
            expect(highlighted.length).toBeGreaterThan(0);
            expect(highlighted[0]).toMatchTextContent(/^5$/);
        });
    });

    it.each([
        ['wheel', false, 'list-outer'],
        ['wheel', true, 'list-outer'],
        ['normal', false, 'item'],
    ] as const)('%s 列（循环：%s）的 listbox 获得键盘焦点时，列周围显示主题焦点环', async (mode, cycled, columnClass) => {
        const { container } = render(ScrollList, {
            props: { header: 'column' },
            slots: { default: () => <ScrollItem cycled={cycled} list={list} mode={mode} selectedIndex={1} /> },
        });
        const listbox = screen.getAllByRole('listbox')[0];
        await tabTo(listbox);
        expectThemeFocusRing(container.querySelector(`.${prefix}-${columnClass}`) as Element);
    });

    describe('wheel 模式的受控 select', () => {
        // absence checks have no condition to wait on: the scroll that follows a selection settles within ~200ms
        const settle = () => sleep(600);

        // Testing Library re-inserts the mounted nodes, which resets the scroll position set on mount, so the app
        // mounts in place
        function mountInPlace(props: Record<string, unknown>) {
            const host = document.body.appendChild(document.createElement('div'));
            const app = createApp(Controlled, props);
            app.mount(host);
            onTestFinished(() => {
                app.unmount();
                host.remove();
            });
        }

        it.each([false, true])('挂载时不为初始 selectedIndex 发出 select（循环：%s）', async (cycled) => {
            const onSelect = vi.fn<(value: number) => void>();
            mountInPlace({ cycled, initial: 5, label: 'wheel', mode: 'wheel', onSelect });
            await settle();
            expect(onSelect).not.toHaveBeenCalled();
        });

        it.each([false, true])('方向键选中只发出一次 select（循环：%s）', async (cycled) => {
            const onSelect = vi.fn<(value: number) => void>();
            mountInPlace({ cycled, initial: 5, label: 'wheel', mode: 'wheel', onSelect });
            await settle();
            await tabTo(screen.getByRole('listbox'));
            await userEvent.keyboard('{ArrowDown}');
            await settle();
            expect(onSelect.mock.calls).toEqual([[6]]);
        });

        it('父组件修改 selectedIndex 不发出 select', async () => {
            const onSelect = vi.fn<(data: ScrollItemSelectData) => void>();
            const view = render(ScrollItem, { props: { 'aria-label': 'wheel', list, selectedIndex: 3, onSelect } });
            await settle();
            await view.rerender({ selectedIndex: 8 });
            await settle();
            expect(onSelect).not.toHaveBeenCalled();
        });
    });

    it('聚焦列上按 ArrowDown 选中下一个值，并将其滚动到中间', async () => {
        render(Controlled);
        const listbox = screen.getByRole('listbox');
        await tabTo(listbox);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        const active = () => document.getElementById(listbox.getAttribute('aria-activedescendant') ?? '');
        await waitFor(() => expect(active()).toMatchTextContent(/^3$/));
        expect(listbox).toHaveFocus();
    });
});
