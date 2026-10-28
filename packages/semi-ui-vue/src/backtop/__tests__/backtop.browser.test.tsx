/** @jsxImportSource vue */
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import BackTop from '../backtop.vue';
import ScrollTarget from './fixtures/scroll-target.vue';

const renderScroller = () => {
    const view = render(() => (
        <div>
            <button data-testid="start">start</button>
            <ScrollTarget />
        </div>
    ));
    return { view, scroller: screen.getByTestId('scroller') };
};

describe('BackTop 浏览器', () => {
    it('位于 BackTop 位置，为 32px 圆形 FloatButton，在 RTL 下镜像', async () => {
        render(() => (
            <div>
                <BackTop aria-label="ltr" visibilityHeight={-1} />
                <div dir="rtl">
                    <BackTop aria-label="rtl" visibilityHeight={-1} />
                </div>
            </div>
        ));
        const ltr = await screen.findByRole('button', { name: 'ltr' });
        const rtl = await screen.findByRole('button', { name: 'rtl' });
        const rect = ltr.getBoundingClientRect();
        expect(document.documentElement.clientWidth - rect.right).toBe(100);
        expect(window.innerHeight - rect.bottom).toBe(50);
        expect(rect.width).toBe(32);
        expect(rect.height).toBe(32);
        const style = getComputedStyle(ltr);
        expect(style.position).toBe('fixed');
        expect(style.zIndex).toBe('10');
        expect(style.borderTopLeftRadius).not.toBe('0px');
        expect(rtl.getBoundingClientRect().left).toBe(100);
        expect(rtl.getBoundingClientRect().width).toBe(32);
    });

    it('目标滚动超过 visibilityHeight 后出现，点击后滚回顶部', async () => {
        const { scroller } = renderScroller();
        expect(screen.queryByRole('button', { name: 'Back to top' })).toBeNull();
        scroller.scrollTop = 1000;
        const button = await screen.findByRole('button', { name: 'Back to top' });
        expect(button.tagName).toBe('BUTTON');
        await userEvent.click(button);
        await waitFor(() => expect(scroller.scrollTop).toBe(0));
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Back to top' })).toBeNull());
    });

    it('可通过 Tab 聚焦，按 Enter 或 Space 将目标滚动到顶部', async () => {
        const { view, scroller } = renderScroller();
        scroller.scrollTop = 1000;
        const button = await screen.findByRole('button', { name: 'Back to top' });

        await userEvent.click(screen.getByTestId('start'));
        await userEvent.keyboard('{Tab}');
        if (document.activeElement === scroller) {
            // a scrollable region is focusable in some browsers
            await userEvent.keyboard('{Tab}');
        }
        expect(document.activeElement).toBe(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(scroller.scrollTop).toBe(0));
        expect(view.getByLabelText('clicks')).toHaveTextContent('1');

        // scrollTop rounds to 0 before the last animation frame, which would otherwise overwrite the next scroll
        await new Promise((resolve) => setTimeout(resolve, 150));
        scroller.scrollTop = 1000;
        const again = await screen.findByRole('button', { name: 'Back to top' });
        again.focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(scroller.scrollTop).toBe(0));
        expect(view.getByLabelText('clicks')).toHaveTextContent('2');
    });
});
