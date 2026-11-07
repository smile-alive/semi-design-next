import { createSignal } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import Container from '../container';
import type { ContainerSolidProps } from '../interface';

describe('Sidebar.Container 的 Resizable', () => {
    it('唯一启用的左边拖拽条是键盘可用的分隔符', () => {
        render(() => <Container title="Title" motion={false} visible />);
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
        const { container, unmount } = render(() => <Container title="Title" motion={false} visible />);
        const handle = container.querySelector<HTMLElement>('.semi-resizable-resizableHandler-left');
        expect(handle).not.toBeNull();
        expect(handle?.parentElement?.inert).toBeFalsy();
        unmount();
        release();
        modal.remove();
    });

    it.each([true, false])('resizable 为 %s 时，展开传入的属性变化不重新挂载内容', (resizable) => {
        const [props, setProps] = createSignal<ContainerSolidProps>({ title: 'A', resizable, motion: false, visible: true });
        const { container } = render(() => (
            <Container {...props()}>
                <input aria-label="field" />
            </Container>
        ));
        const content = container.querySelector('.semi-sidebar-container');
        const field = screen.getByRole('textbox');
        setProps({ title: 'B', resizable, motion: false, visible: true });
        expect(container.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('B');
        expect(container.querySelector('.semi-sidebar-container')).toBe(content);
        expect(screen.getByRole('textbox')).toBe(field);
    });
});
