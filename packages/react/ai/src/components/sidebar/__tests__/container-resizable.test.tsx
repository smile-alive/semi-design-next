import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import { Sidebar } from '@fibrae/semi-ai-react';

const { Container } = Sidebar;

describe('Sidebar.Container 的 Resizable', () => {
    it('唯一启用的左边拖拽条是键盘可用的分隔符', () => {
        render(<Container title="Title" motion={false} visible />);
        const separator = screen.getByRole('separator');
        expect(separator).toHaveClass('semi-resizable-resizableHandler-left');
        expect(separator).toHaveAttribute('tabindex', '0');
        expect(separator).toHaveAttribute('aria-orientation', 'vertical');
        expect(separator).toHaveAccessibleName();
        expect(fireEvent.keyDown(separator, { key: 'ArrowLeft' })).toBe(false);
    });

    it('先打开的模态浮层不会让侧边栏自己的拖拽条变为 inert', () => {
        const modal = document.createElement('div');
        document.body.append(modal);
        const release = openLayer({ element: modal, modal: true });
        const { container, unmount } = render(<Container title="Title" motion={false} visible />);
        const handle = container.querySelector<HTMLElement>('.semi-resizable-resizableHandler-left');
        expect(handle).not.toBeNull();
        expect(handle?.parentElement?.inert).toBeFalsy();
        unmount();
        release();
        modal.remove();
    });
});
