import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { IconEdit } from '@fibrae/semi-icons-react';
import { Button, IconButton } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';

describe('Button（浏览器）', () => {
    it.each([
        ['Button', <Button key="b">go</Button>, 'go'],
        ['IconButton', <IconButton key="i" aria-label="edit" icon={<IconEdit />} />, 'edit'],
    ])('%s：键盘焦点显示主题焦点环', async (_, element, name) => {
        render(element);
        const button = screen.getByRole('button', { name });
        await tabTo(button);
        expectThemeFocusRing(button);
    });

    it('纯图标 IconButton 通过 aria-label 命名', () => {
        render(<IconButton aria-label="edit" icon={<IconEdit />} />);
        expect(screen.getByRole('button', { name: 'edit' })).toBeVisible();
    });

    it('禁用按钮不在 Tab 顺序中，且忽略键盘操作', async () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        render(
            <>
                <Button disabled onClick={onClick}>
                    off
                </Button>
                <IconButton aria-label="edit" disabled icon={<IconEdit />} onClick={onClick} />
                <button type="button">next</button>
            </>
        );
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'next' })).toHaveFocus();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('加载中的按钮仍是 Tab 停靠点并显示加载动画；disabled 优先于 loading', async () => {
        const { container, rerender } = render(<Button loading>save</Button>);
        const button = screen.getByRole('button', { name: 'save' });
        await tabTo(button);
        expect(container.querySelector('[data-icon="spin"]')).toBeVisible();

        rerender(
            <Button disabled loading>
                save
            </Button>
        );
        expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
        expect(container.querySelector('[data-icon="spin"]')).toBeNull();
    });

    it('容器上覆盖 --semi-color-primary 后主按钮背景随之变化', async () => {
        const { container } = render(
            <div>
                <Button type="primary" theme="solid">
                    go
                </Button>
            </div>
        );
        const root = container.firstElementChild as HTMLElement;
        root.style.setProperty('--semi-color-primary', 'rgb(1, 2, 3)');
        await expect.poll(() => getComputedStyle(container.querySelector('.semi-button-primary')).backgroundColor).toBe('rgb(1, 2, 3)');
    });
});
