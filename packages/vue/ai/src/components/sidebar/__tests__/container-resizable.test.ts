import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import { render } from '@test/utils/vue';
import Sidebar from '..';

const { Container } = Sidebar;

describe('Sidebar.Container 的 Resizable', () => {
    it('唯一启用的左边拖拽条是键盘可用的分隔符', () => {
        render(Container, { props: { title: 'Title', motion: false, visible: true } });
        const separator = screen.getByRole('separator');
        expect(separator).toHaveClass('semi-resizable-resizableHandler-left');
        expect(separator).toHaveAttribute('tabindex', '0');
        expect(separator).toHaveAttribute('aria-orientation', 'vertical');
        expect(separator).toHaveAccessibleName();
        expect(separator.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))).toBe(false);
    });

    it('先打开的模态浮层不会让侧边栏自己的拖拽条变为 inert', async () => {
        const modal = document.createElement('div');
        document.body.append(modal);
        const release = openLayer({ element: modal, modal: true });
        const view = render(Container, { props: { title: 'Title', motion: false, visible: true } });
        await Promise.resolve();
        const handle = view.container.querySelector<HTMLElement>('.semi-resizable-resizableHandler-left');
        expect(handle).not.toBeNull();
        expect(handle?.parentElement?.inert).toBeFalsy();
        view.unmount();
        release();
        modal.remove();
    });
});
