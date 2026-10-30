import { flushSync, mount, unmount } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import Rating from '../rating.svelte';
import RatingFixture from './rating-fixture.svelte';
import RatingModel from './rating-model.svelte';

type FixtureStore = NonNullable<Parameters<typeof RatingFixture>[1]>['store'];

const getStars = () => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-second`)];
const getStar = (index: number) => getStars()[index] as HTMLElement;
const getList = () => document.querySelector<HTMLElement>(`ul.${BASE_CLASS_PREFIX}-rating`) as HTMLElement;
const getWrapper = (radio: HTMLElement) => radio.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-wrapper`) as HTMLElement;
const getTip = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`);

function renderRating(props: FixtureStore['props'], extra: Partial<Omit<FixtureStore, 'props'>> = {}) {
    const store = createStore<FixtureStore>({ props, ...extra });
    return { store, ...render(RatingFixture, { props: { store } }) };
}

describe('Svelte Rating（浏览器）', () => {
    it('ShadowRoot 内 blur() 让聚焦的星星失焦', () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mountPoint = document.createElement('div');
        shadow.append(mountPoint);
        const instance = mount(Rating, { target: mountPoint });
        // mount() leaves effects pending: bind:this has not run yet
        flushSync();
        try {
            const star = shadow.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-second`) as HTMLElement;
            star.focus();
            expect(shadow.activeElement).toBe(star);
            instance.blur();
            expect(shadow.activeElement).toBeNull();
        } finally {
            void unmount(instance);
            host.remove();
        }
    });

    it('指针悬停星星时显示预览填充与对应 tooltip，离开后复位', async () => {
        const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
        renderRating({ tooltips: desc });
        await userEvent.hover(getStar(2));
        await waitFor(() => expect(getTip()).toHaveTextContent('normal'));
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-rating-star-full`)).toHaveLength(3);
        await userEvent.hover(getStar(3));
        await waitFor(() => expect(getTip()).toHaveTextContent('good'));
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-rating-star-full`)).toHaveLength(4);
        await userEvent.unhover(getList());
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-rating-star-full`)).toHaveLength(0);
    });

    it('allowHalf 时指针落在星的左半边悬停半星，落在右半边悬停整星', async () => {
        const hover = vi.fn<(value?: number) => void>();
        renderRating({ allowHalf: true, onHoverChange: hover });
        const rect = getWrapper(getStar(1)).getBoundingClientRect();
        await userEvent.hover(getWrapper(getStar(1)), { position: { x: 1, y: rect.height / 2 } });
        expect(hover).toHaveBeenLastCalledWith(1.5);
        await userEvent.hover(getWrapper(getStar(1)), { position: { x: rect.width - 1, y: rect.height / 2 } });
        expect(hover).toHaveBeenLastCalledWith(2);
    });

    it('radio 搭配额外内容', async () => {
        const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
        render(RatingModel, { props: { tooltips: desc } });
        const result = () => document.querySelector('#rating-result');
        const press = async (key: string, focusedIndex: number) => {
            expect(getStar(focusedIndex)).toHaveFocus();
            await userEvent.keyboard(key);
            flushSync();
        };
        const clickStar = async (index: number) => {
            await userEvent.hover(getStar(index));
            await waitFor(() => expect(getTip()).toHaveTextContent(desc[index] as string));
            await userEvent.click(getStar(index));
            flushSync();
        };

        await clickStar(3);
        expect(result()).toHaveTextContent('good');
        await press('{ArrowRight}', 3);
        expect(result()).toHaveTextContent('wonderful');
        await press('{ArrowRight}', 4);
        expect(result()).toBeNull();
        await press('{ArrowRight}', 5);
        expect(result()).toHaveTextContent('terrible');

        await clickStar(1);
        expect(result()).toHaveTextContent('bad');
        await press('{ArrowLeft}', 1);
        expect(result()).toHaveTextContent('terrible');
        await press('{ArrowLeft}', 0);
        expect(result()).toBeNull();
    });

    // Testing Library re-inserts the mounted nodes, which drops the focus taken on mount, so the app mounts in place
    it('autofocus', async () => {
        const host = document.body.appendChild(document.createElement('div'));
        const instance = mount(Rating, { target: host, props: { autofocus: true, value: 2 } });
        flushSync();
        onTestFinished(() => {
            void unmount(instance);
            host.remove();
        });
        expect(getStar(1)).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        expect(getStar(2)).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(getStar(1)).toHaveFocus();
    });

    it('Tab 聚焦选中的星，星的 wrapper 显示主题焦点环，列表没有', async () => {
        renderRating({ value: 3 });
        await tabTo(getStar(2));
        expectThemeFocusRing(getWrapper(getStar(2)));
        expect(getComputedStyle(getList()).outlineStyle).toBe('none');
    });

    it('Tab 聚焦空星时，列表显示主题焦点环，空星 wrapper 没有', async () => {
        renderRating({ value: 0 });
        const empty = getStar(5);
        await tabTo(empty);
        expectThemeFocusRing(getList());
        expect(getComputedStyle(getWrapper(empty)).outlineStyle).toBe('none');
    });

    it('鼠标点击星后再按键，星的 wrapper 显示主题焦点环', async () => {
        renderRating({ value: 2, allowClear: false });
        await userEvent.click(getStar(2));
        expect(getStar(2)).toHaveFocus();
        // Space on the checked star changes nothing, it only makes the browser treat the focus as keyboard focus
        await userEvent.keyboard(' ');
        expectThemeFocusRing(getWrapper(getStar(2)));
    });

    it('方向键移动焦点时，键盘焦点所在星显示 tooltip', async () => {
        renderRating({ value: 2, tooltips: ['a', 'b', 'c', 'd', 'e'] }, { after: true });
        await userEvent.tab();
        await waitFor(() => expect(getTip()).toHaveTextContent('b'));
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(getTip()).toHaveTextContent('c'));
        expect(getStar(2)).toHaveFocus();
    });

    it('按 Enter 选中星级，无需按下 change 移动焦点所在的按钮', async () => {
        const confirm = vi.fn<() => void>();
        const store = createStore<FixtureStore>({ props: { onChange: () => screen.getByRole('button', { name: 'confirm' }).focus() } });
        render(RatingFixture, { props: { store } });
        const button = document.body.appendChild(document.createElement('button'));
        button.type = 'button';
        button.textContent = 'confirm';
        button.addEventListener('click', confirm);
        onTestFinished(() => button.remove());
        getStar(0).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(button).toHaveFocus());
        expect(confirm).not.toHaveBeenCalled();
    });

    it('Space 选中未选中的星', async () => {
        renderRating({ value: 1 });
        getStar(3).focus();
        await userEvent.keyboard(' ');
        flushSync();
        expect(getStar(3)).toHaveAttribute('aria-checked', 'true');
        expect(getStar(3)).toHaveFocus();
    });
});
