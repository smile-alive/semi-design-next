import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Banner from '..';

describe('Banner（浏览器）', () => {
    it('具名关闭按钮是 Tab 停靠点，并显示主题焦点环', async () => {
        render(() => <Banner description="hello" />);
        const close = screen.getByRole('button', { name: zh_CN.Banner.close });
        await tabTo(close);
        expectThemeFocusRing(close);
    });

    it.each([['Enter'], [' ']])('关闭按钮上的 %j 会关闭 Banner 并调用 onClose', async (key) => {
        const onClose = vi.fn<() => void>();
        render(() => <Banner description="hello" onClose={onClose} />);
        await tabTo(screen.getByRole('button', { name: zh_CN.Banner.close }));
        await userEvent.keyboard(key === ' ' ? ' ' : `{${key}}`);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('hello')).toBeNull();
    });

    it('ShadowRoot 内关闭 Banner 后焦点移到同一 ShadowRoot 内的下一个可聚焦元素', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(
            () => (
                <div>
                    <Banner description="hello" />
                    <button type="button">after</button>
                </div>
            ),
            { container: mount }
        );
        try {
            const close = shadow.querySelector('button[aria-label]') as HTMLElement;
            close.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(shadow.activeElement).toHaveTextContent('after'));
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
