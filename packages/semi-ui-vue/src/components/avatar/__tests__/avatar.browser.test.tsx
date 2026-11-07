/** @jsxImportSource vue */
import { waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Avatar from '../avatar.vue';

const prefix = 'semi-avatar';
const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>')}`;

describe('Avatar 浏览器', () => {
    it.each([
        ['extra-extra-small', '3px'],
        ['extra-small', '3px'],
        ['small', '3px'],
        ['large', '6px'],
        ['extra-large', '12px'],
    ])('方形描边 %s 的圆角跟随头像', (size, radius) => {
        const view = render(Avatar, { props: { border: true, shape: 'square', size, src: image } });
        expect(getComputedStyle(view.container.querySelector(`.${prefix}-additionalBorder`) as HTMLElement).borderTopLeftRadius).toBe(radius);
    });

    it.each(['image', 'text', 'element'])('%s 内容可点击头像支持键盘和主题焦点环', async (kind) => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const view = render(Avatar, {
            props: { alt: 'avatar', src: kind === 'image' ? image : undefined },
            attrs: { onClick: click },
            slots: kind === 'image' ? {} : { default: () => (kind === 'text' ? 'U' : <b>icon</b>) },
        });
        const root = view.container.querySelector(`.${prefix}`) as HTMLElement;
        const button = view.getByRole('button', { name: 'avatar' });
        await userEvent.click(button);
        expect(button).toHaveFocus();
        expect(getComputedStyle(root).outlineStyle).toBe('none');
        await userEvent.keyboard('{Backspace}');
        expectThemeFocusRing(root);
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(click).toHaveBeenCalledTimes(3);
    });

    it('不可点击头像内的链接有自己的焦点，头像无焦点环', async () => {
        const view = render(Avatar, { slots: { default: () => <a href="#top" aria-label="link" /> } });
        await tabTo(view.getByRole('link'));
        expect(view.getByRole('link')).toHaveFocus();
        expect(getComputedStyle(view.container.querySelector(`.${prefix}`) as HTMLElement).outlineStyle).toBe('none');
    });

    it('Tab 进入图片头像后 Enter 激活，Escape 保留焦点与主题焦点环', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const view = render(Avatar, { props: { alt: 'cat', src: image }, attrs: { onClick: click } });
        const button = view.getByRole('button', { name: 'cat' });
        const root = view.container.querySelector(`.${prefix}`) as HTMLElement;
        await tabTo(button);
        expectThemeFocusRing(root);
        await userEvent.keyboard('{Enter}{Escape}{Backspace}');
        expect(click).toHaveBeenCalledTimes(1);
        expect(button).toHaveFocus();
        expectThemeFocusRing(root);
    });

    it('图片失败后恢复新 src，可测量文字缩放', async () => {
        const view = render(Avatar, { props: { src: image }, slots: { default: () => 'A very long avatar label' } });
        await view.rerender({ src: 'data:image/png;base64,AAAA' });
        await waitFor(() => expect(view.container.querySelector('img')).toBeNull());
        const text = view.container.querySelector(`.${prefix}-content`) as HTMLElement;
        expect(getComputedStyle(text).transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)');
        await view.rerender({ src: image });
        await waitFor(() => expect(view.container.querySelector('img')).not.toBeNull());
    });
});
