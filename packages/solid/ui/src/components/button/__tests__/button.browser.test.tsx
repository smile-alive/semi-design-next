import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { IconEdit } from '@fibrae/semi-icons-solid';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Button, { ButtonGroup } from '..';
import IconButton from '../../icon-button';

type Handler = (event: MouseEvent) => void;

describe('Button（浏览器）', () => {
    it.each([
        ['Button', () => <Button>go</Button>, 'go'],
        ['IconButton', () => <IconButton aria-label="edit" icon={IconEdit} />, 'edit'],
    ])('%s：键盘焦点显示主题焦点环', async (_, view, name) => {
        render(view);
        const button = screen.getByRole('button', { name });
        await tabTo(button);
        expectThemeFocusRing(button);
    });

    it('纯图标 IconButton 通过 aria-label 命名', () => {
        render(() => <IconButton aria-label="edit" icon={<IconEdit />} />);
        expect(screen.getByRole('button', { name: 'edit' })).toBeVisible();
    });

    it('禁用按钮不在 Tab 顺序中，且忽略键盘操作', async () => {
        const onClick = vi.fn<Handler>();
        render(() => (
            <>
                <Button disabled onClick={onClick}>
                    off
                </Button>
                <IconButton aria-label="edit" disabled icon={IconEdit} onClick={onClick} />
                <button type="button">next</button>
            </>
        ));
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'next' })).toHaveFocus();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('加载中的按钮仍是 Tab 停靠点并显示加载动画；disabled 优先于 loading', async () => {
        const [disabled, setDisabled] = createSignal(false);
        const { container } = render(() => (
            <Button loading disabled={disabled()}>
                save
            </Button>
        ));
        await tabTo(screen.getByRole('button', { name: 'save' }));
        expect(container.querySelector('[data-icon="spin"]')).toBeVisible();
        setDisabled(true);
        expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
        expect(container.querySelector('[data-icon="spin"]')).toBeNull();
    });

    it('容器上覆盖 --semi-color-primary 后主按钮背景随之变化', async () => {
        const { container } = render(() => (
            <div>
                <Button type="primary" theme="solid">
                    go
                </Button>
            </div>
        ));
        const root = container.firstElementChild as HTMLElement;
        root.style.setProperty('--semi-color-primary', 'rgb(1, 2, 3)');
        await expect.poll(() => getComputedStyle(container.querySelector('.semi-button-primary') as Element).backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('Enter 与 Space 激活 click，loading 时都不触发', async () => {
        const onClick = vi.fn<Handler>();
        const [loading, setLoading] = createSignal(false);
        render(() => (
            <Button loading={loading()} onClick={onClick}>
                go
            </Button>
        ));
        await tabTo(screen.getByRole('button'));
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
        setLoading(true);
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('点击 disabled 按钮内部文本，祖先监听器不触发', async () => {
        const outer = vi.fn<Handler>();
        render(() => (
            <div role="presentation" onClick={outer}>
                <Button disabled>off</Button>
            </div>
        ));
        await userEvent.click(screen.getByText('off'), { force: true });
        expect(outer).not.toHaveBeenCalled();
    });

    it('loading 切换后焦点仍在同一个按钮上', async () => {
        const [loading, setLoading] = createSignal(false);
        render(() => <Button loading={loading()}>save</Button>);
        const button = screen.getByRole('button');
        await tabTo(button);
        setLoading(true);
        expect(screen.getByRole('button')).toBe(button);
        expect(button).toHaveFocus();
        setLoading(false);
        expect(button).toHaveFocus();
    });

    it('ButtonGroup 内按钮按顺序获得焦点，分隔线不进入 Tab 顺序，焦点环可见', async () => {
        render(() => (
            <ButtonGroup aria-label="actions">
                <Button>a</Button>
                <Button>b</Button>
                <Button>c</Button>
            </ButtonGroup>
        ));
        const [a, b, c] = screen.getAllByRole('button');
        await tabTo(a);
        expectThemeFocusRing(a);
        await userEvent.keyboard('{Tab}');
        expect(b).toHaveFocus();
        expectThemeFocusRing(b);
        await userEvent.keyboard('{Tab}');
        expect(c).toHaveFocus();
    });
});
