import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { AvatarProps } from '../interface';
import AvatarFixture from './avatar-fixture.svelte';

const prefix = 'semi-avatar';
const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>')}`;

type Store = AvatarProps & { label?: string; node?: boolean };

function setup(props: Store) {
    const store = createStore<Store>(props);
    const view = render(AvatarFixture, { props: { store } });
    return { store, container: view.container };
}

describe('Svelte Avatar 浏览器', () => {
    it.each([
        ['extra-extra-small', '3px'],
        ['extra-small', '3px'],
        ['small', '3px'],
        ['large', '6px'],
        ['extra-large', '12px'],
    ])('方形描边 %s 的圆角跟随头像', (size, radius) => {
        const { container } = setup({ border: true, shape: 'square', size, src: image });
        expect(getComputedStyle(container.querySelector(`.${prefix}-additionalBorder`) as HTMLElement).borderTopLeftRadius).toBe(radius);
    });

    it.each(['image', 'text', 'element'])('%s 内容可点击头像支持键盘和主题焦点环', async (kind) => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ alt: 'avatar', src: kind === 'image' ? image : undefined, onclick: click, node: kind === 'element', label: kind === 'text' ? 'U' : 'icon' });
        const root = container.querySelector(`.${prefix}`) as HTMLElement;
        const button = await screen.findByRole('button', { name: 'avatar' });
        await userEvent.click(button);
        expect(button).toHaveFocus();
        expect(getComputedStyle(root).outlineStyle).toBe('none');
        await userEvent.keyboard('{Backspace}');
        expectThemeFocusRing(root);
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(click).toHaveBeenCalledTimes(3);
    });

    it('Tab 进入图片头像后 Enter 激活，Escape 保留焦点与主题焦点环', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ alt: 'cat', src: image, onclick: click });
        const button = screen.getByRole('button', { name: 'cat' });
        const root = container.querySelector(`.${prefix}`) as HTMLElement;
        await tabTo(button);
        expectThemeFocusRing(root);
        await userEvent.keyboard('{Enter}{Escape}{Backspace}');
        expect(click).toHaveBeenCalledTimes(1);
        expect(button).toHaveFocus();
        expectThemeFocusRing(root);
    });

    it('图片失败后恢复新 src，可测量文字缩放', async () => {
        const { store, container } = setup({ src: image, label: 'A very long avatar label' });
        store.src = 'data:image/png;base64,AAAA';
        await vi.waitFor(() => expect(container.querySelector('img')).toBeNull());
        const text = container.querySelector(`.${prefix}-content`) as HTMLElement;
        await vi.waitFor(() => expect(getComputedStyle(text).transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)'));
        store.src = image;
        await vi.waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    });
});
