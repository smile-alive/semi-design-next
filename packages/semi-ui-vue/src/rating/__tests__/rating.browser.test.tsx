/** @jsxImportSource vue */
import { createApp, shallowRef } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Rating from '..';
import type { RatingHandle } from '../interface';
import Model from './fixtures/model.vue';

const getStars = () => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-second`)];
const getStar = (index: number) => getStars()[index] as HTMLElement;
const getList = () => document.querySelector<HTMLElement>(`ul.${BASE_CLASS_PREFIX}-rating`) as HTMLElement;
const getWrapper = (radio: HTMLElement) => radio.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-wrapper`) as HTMLElement;

describe('Rating（浏览器）', () => {
    it('ShadowRoot 内 ref.blur() 让聚焦的星星失焦', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const handle = shallowRef<RatingHandle | null>(null);
        const view = render(() => <Rating ref={handle} />, { container: mount });
        try {
            const star = shadow.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-second`) as HTMLElement;
            star.focus();
            expect(shadow.activeElement).toBe(star);
            handle.value?.blur();
            expect(shadow.activeElement).toBeNull();
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('radio 搭配额外内容', async () => {
        const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
        render(Model, { props: { tooltips: desc } });
        const result = () => document.querySelector('#rating-result');
        const press = async (key: string, focusedIndex: number) => {
            expect(getStar(focusedIndex)).toHaveFocus();
            await userEvent.keyboard(key);
        };
        const clickStar = async (index: number) => {
            await userEvent.hover(getStar(index));
            await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent(desc[index] as string));
            await userEvent.click(getStar(index));
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
        const app = createApp(Rating, { autofocus: true, defaultValue: 2 });
        app.mount(host);
        onTestFinished(() => {
            app.unmount();
            host.remove();
        });
        expect(getStar(1)).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        expect(getStar(2)).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(getStar(1)).toHaveFocus();
    });

    it('Tab 聚焦选中的星，星的 wrapper 显示主题焦点环，列表没有', async () => {
        render(Rating, { props: { defaultValue: 3 } });
        await tabTo(getStar(2));
        expectThemeFocusRing(getWrapper(getStar(2)));
        expect(getComputedStyle(getList()).outlineStyle).toBe('none');
    });

    it('Tab 聚焦空星时，列表显示主题焦点环，空星 wrapper 没有', async () => {
        render(Rating, { props: { defaultValue: 0 } });
        const empty = getStar(5);
        await tabTo(empty);
        expectThemeFocusRing(getList());
        expect(getComputedStyle(getWrapper(empty)).outlineStyle).toBe('none');
    });

    it('鼠标点击星后再按键，星的 wrapper 显示主题焦点环', async () => {
        render(Rating, { props: { defaultValue: 2, allowClear: false } });
        await userEvent.click(getStar(2));
        expect(getStar(2)).toHaveFocus();
        // Space on the checked star changes nothing, it only makes the browser treat the focus as keyboard focus
        await userEvent.keyboard(' ');
        expectThemeFocusRing(getWrapper(getStar(2)));
    });

    it('按 Enter 选中星级，无需按下 change 移动焦点所在的按钮', async () => {
        const confirm = vi.fn<() => void>();
        render({
            render: () => (
                <>
                    <Rating onChange={() => screen.getByRole('button', { name: 'confirm' }).focus()} />
                    <button type="button" onClick={confirm}>
                        confirm
                    </button>
                </>
            ),
        });
        getStar(0).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
        expect(confirm).not.toHaveBeenCalled();
    });

    it('Space 选中未选中的星', async () => {
        render(Rating, { props: { defaultValue: 1 } });
        getStar(3).focus();
        await userEvent.keyboard(' ');
        expect(getStar(3)).toHaveAttribute('aria-checked', 'true');
        expect(getStar(3)).toHaveFocus();
    });
});
