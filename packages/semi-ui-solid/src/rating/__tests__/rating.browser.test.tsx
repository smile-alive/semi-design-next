import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Rating from '..';

const getStars = () => document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-second`);
const getList = () => document.querySelector(`ul.${BASE_CLASS_PREFIX}-rating`) as HTMLElement;
const getWrapper = (radio: HTMLElement) => radio.closest(`.${BASE_CLASS_PREFIX}-rating-star-wrapper`) as HTMLElement;

describe('Rating（浏览器）', () => {
    it('radio 搭配额外内容：指针悬停显示 tooltip 后点击与方向键更新值', async () => {
        const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
        const [value, setValue] = createSignal(0);
        render(() => (
            <div>
                <span>
                    How was the help you received: <span id="rating-result">{value() ? desc[value() - 1] : ''}</span>
                </span>
                <Rating value={value()} tooltips={desc} onChange={setValue} />
            </div>
        ));
        const result = () => document.querySelector('#rating-result') as HTMLElement;
        const press = async (key: string, focusedIndex: number) => {
            expect(getStars()[focusedIndex]).toHaveFocus();
            await userEvent.keyboard(key);
        };
        const clickStar = async (index: number) => {
            await userEvent.hover(getStars()[index]);
            await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent(desc[index]));
            await userEvent.click(getStars()[index]);
        };

        await clickStar(3);
        expect(result()).toHaveTextContent('good');
        await press('{ArrowDown}', 3);
        expect(result()).toHaveTextContent('wonderful');
        await press('{ArrowDown}', 4);
        expect(result().textContent).toBe('');
        await press('{ArrowRight}', 5);
        expect(result()).toHaveTextContent('terrible');

        await clickStar(1);
        expect(result()).toHaveTextContent('bad');
        await press('{ArrowLeft}', 1);
        expect(result()).toHaveTextContent('terrible');
        await press('{ArrowUp}', 0);
        expect(result().textContent).toBe('');
    });

    it('指针真实悬停星的右半与左半得到整星与半星值', async () => {
        const onHoverChange = vi.fn<(value?: number) => void>();
        render(() => <Rating allowHalf onHoverChange={onHoverChange} />);
        const star = getStars()[2].closest('li') as HTMLElement;
        const rect = star.getBoundingClientRect();
        await userEvent.hover(getWrapper(getStars()[2]), { position: { x: rect.width * 0.25, y: rect.height / 2 } });
        expect(onHoverChange).toHaveBeenLastCalledWith(2.5);
        await userEvent.hover(getWrapper(getStars()[2]), { position: { x: rect.width * 0.75, y: rect.height / 2 } });
        expect(onHoverChange).toHaveBeenLastCalledWith(3);
        await userEvent.unhover(getWrapper(getStars()[2]));
        expect(onHoverChange).toHaveBeenLastCalledWith(undefined);
    });

    it('autofocus 后方向键移动焦点', async () => {
        render(() => <Rating autofocus defaultValue={2} />);
        expect(getStars()[1]).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getStars()[2]).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(getStars()[1]).toHaveFocus();
    });

    it('Tab 聚焦选中的星，星的 wrapper 显示主题焦点环，列表没有', async () => {
        render(() => <Rating defaultValue={3} />);
        await tabTo(getStars()[2]);
        expectThemeFocusRing(getWrapper(getStars()[2]));
        expect(getComputedStyle(getList()).outlineStyle).toBe('none');
    });

    it('Tab 聚焦空星时，列表显示主题焦点环，空星 wrapper 没有', async () => {
        render(() => <Rating defaultValue={0} />);
        const empty = getStars()[5];
        await tabTo(empty);
        expectThemeFocusRing(getList());
        expect(getComputedStyle(getWrapper(empty)).outlineStyle).toBe('none');
    });

    it('鼠标点击星后再按键，星的 wrapper 显示主题焦点环', async () => {
        render(() => <Rating defaultValue={2} allowClear={false} />);
        await userEvent.click(getStars()[2]);
        expect(getStars()[2]).toHaveFocus();
        // Space on the checked star does nothing, it only makes the browser treat the focus as keyboard focus
        await userEvent.keyboard(' ');
        expectThemeFocusRing(getWrapper(getStars()[2]));
    });

    it('按 Enter 选中星级，无需按下 onChange 移动焦点所在的按钮', async () => {
        const onConfirm = vi.fn<() => void>();
        render(() => (
            <>
                <Rating onChange={() => screen.getByRole('button', { name: 'confirm' }).focus()} />
                <button type="button" onClick={onConfirm}>
                    confirm
                </button>
            </>
        ));
        getStars()[0].focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
