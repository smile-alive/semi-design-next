import { createRef, useState } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Rating } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import type { RatingHandle } from '../index';

const getStars = () => document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-second`);
const getList = () => document.querySelector<HTMLElement>(`ul.${BASE_CLASS_PREFIX}-rating`);
const getWrapper = (radio: HTMLElement) => radio.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-wrapper`);

describe('Rating', () => {
    it('radio 搭配额外内容', async () => {
        const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
        function Demo() {
            const [value, setValue] = useState(0);
            return (
                <div>
                    <span>How was the help you received: {value ? <span id="rating-result">{desc[value - 1]}</span> : ''}</span>
                    <Rating value={value} tooltips={desc} onChange={setValue} />
                </div>
            );
        }
        render(<Demo />);
        const result = () => document.querySelector('#rating-result');
        const press = async (key, focusedIndex) => {
            expect(getStars()[focusedIndex]).toHaveFocus();
            await userEvent.keyboard(key);
        };

        // hover remounts the star after mousemove; wait for it or mousedown and mouseup hit different nodes
        const clickStar = async (index) => {
            await userEvent.hover(getStars()[index]);
            await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveTextContent(desc[index]));
            await userEvent.click(getStars()[index]);
        };

        await clickStar(3);
        expect(result()).toHaveTextContent('good');
        await press('{ArrowDown}', 3);
        expect(result()).toHaveTextContent('wonderful');
        await press('{ArrowDown}', 4);
        expect(result()).toBeNull();
        await press('{ArrowRight}', 5);
        expect(result()).toHaveTextContent('terrible');

        await clickStar(1);
        expect(result()).toHaveTextContent('bad');
        await press('{ArrowLeft}', 1);
        expect(result()).toHaveTextContent('terrible');
        await press('{ArrowUp}', 0);
        expect(result()).toBeNull();
    });

    it('autoFocus', async () => {
        render(<Rating autoFocus defaultValue={2} />);
        expect(getStars()[1]).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getStars()[2]).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(getStars()[1]).toHaveFocus();
    });

    it('Tab 聚焦选中的星，星的 wrapper 显示主题焦点环，列表没有', async () => {
        render(<Rating defaultValue={3} />);
        await tabTo(getStars()[2]);
        expectThemeFocusRing(getWrapper(getStars()[2]));
        expect(getComputedStyle(getList()).outlineStyle).toBe('none');
    });

    it('Tab 聚焦空星时，列表显示主题焦点环，空星 wrapper 没有', async () => {
        render(<Rating defaultValue={0} />);
        const empty = getStars()[5];
        await tabTo(empty);
        expectThemeFocusRing(getList());
        expect(getComputedStyle(getWrapper(empty)).outlineStyle).toBe('none');
    });

    it('鼠标点击星后再按键，星的 wrapper 显示主题焦点环', async () => {
        render(<Rating defaultValue={2} allowClear={false} />);
        await userEvent.click(getStars()[2]);
        expect(getStars()[2]).toHaveFocus();
        // Space on the checked star does nothing, it only makes the browser treat the focus as keyboard focus
        await userEvent.keyboard(' ');
        expectThemeFocusRing(getWrapper(getStars()[2]));
    });

    it('按 Enter 选中星级，无需按下 onChange 移动焦点所在的按钮', async () => {
        const onConfirm = vi.fn<() => void>();
        const { getByRole } = render(
            <>
                <Rating onChange={() => getByRole('button', { name: 'confirm' }).focus()} />
                <button onClick={onConfirm}>confirm</button>
            </>
        );
        getStars()[0].focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getByRole('button', { name: 'confirm' })).toHaveFocus());
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('ShadowRoot 内 ref.blur() 让聚焦的星星失焦', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const ref = createRef<RatingHandle>();
        const view = render(<Rating ref={ref} />, { container: mount });
        try {
            const star = shadow.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-rating-star-second`);
            star.focus();
            expect(shadow.activeElement).toBe(star);
            ref.current.blur();
            expect(shadow.activeElement).toBeNull();
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
