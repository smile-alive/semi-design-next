import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Feedback from '..';
import Button from '../../button';
import SideSheet from '../../side-sheet';

const prefix = `${BASE_CLASS_PREFIX}-feedback`;

describe('Feedback（浏览器）', () => {
    // a keyframes name shared with the SideSheet lets whichever stylesheet loads last change every bottom SideSheet
    it('使用自己的 bottom 关键帧滑入，与旁边的底部 SideSheet 互不影响', async () => {
        render(() => (
            <>
                <Feedback title="T" visible />
                <SideSheet title="S" placement="bottom" visible />
            </>
        ));
        const animationNames = () => [...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-sidesheet-animation-content_show_bottom`)].map((el) => [!!el.closest(`.${prefix}`), getComputedStyle(el).animationName]);
        await expect.poll(animationNames).toEqual(
            expect.arrayContaining([
                [true, `${prefix}-slideShow_bottom`],
                [false, `${BASE_CLASS_PREFIX}-sidesheet-slideShow_bottom`],
            ])
        );
    });

    it('emoji：单选按钮是一个 Tab 停靠点，方向键切换选中，标签显示主题焦点环', async () => {
        render(() => <Feedback motion={false} visible />);
        const bad = await screen.findByRole('radio', { name: zh_CN.Feedback.bad });
        const normal = screen.getByRole('radio', { name: zh_CN.Feedback.normal });
        const item = (radio: HTMLElement) => radio.closest(`.${prefix}-emoji-item`) as HTMLElement;
        const glyph = (radio: HTMLElement) => item(radio).querySelector(`.${prefix}-emoji-glyph`) as HTMLElement;
        expect(getComputedStyle(glyph(bad)).filter).toBe('grayscale(1)');

        await tabTo(bad);
        expectThemeFocusRing(item(bad));
        await userEvent.keyboard('{ArrowRight}');
        expect(normal).toHaveFocus();
        expect(normal).toBeChecked();
        expectThemeFocusRing(item(normal));
        expect(getComputedStyle(glyph(normal)).filter).toBe('none');
        expect(getComputedStyle(glyph(bad)).filter).toBe('grayscale(1)');
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: zh_CN.Feedback.cancel })).toHaveFocus();
    });

    it.each<'modal' | 'popup'>(['modal', 'popup'])('%s 模式：焦点移入对话框，取消后返回打开者', async (mode) => {
        function Page() {
            const [visible, setVisible] = createSignal(false);
            return (
                <>
                    <Button onClick={() => setVisible(true)}>Open</Button>
                    {mode === 'modal' ? <Feedback title="Feedback" mode="modal" motion={false} visible={visible()} onCancel={() => setVisible(false)} /> : <Feedback title="Feedback" motion={false} visible={visible()} onCancel={() => setVisible(false)} />}
                </>
            );
        }
        render(() => <Page />);
        const opener = screen.getByRole('button', { name: 'Open' });
        await userEvent.click(opener);
        const dialog = await screen.findByRole('dialog', { name: 'Feedback' });
        await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
        screen.getByRole('button', { name: zh_CN.Feedback.cancel }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });
});
