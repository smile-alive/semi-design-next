/** @jsxImportSource vue */
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Banner from '../banner.vue';

describe('Banner 浏览器', () => {
    it('具名关闭按钮是 Tab 停靠点，并显示主题焦点环', async () => {
        render(Banner, { slots: { description: () => 'hello' } });
        const close = screen.getByRole('button', { name: zh_CN.Banner.close });
        await tabTo(close);
        expectThemeFocusRing(close);
    });

    it.each([['Enter'], [' ']])('关闭按钮上的 %j 会关闭 Banner 并发出 close', async (key) => {
        const view = render(Banner, { slots: { description: () => 'hello' } });
        await tabTo(screen.getByRole('button', { name: zh_CN.Banner.close }));
        await userEvent.keyboard(key === ' ' ? ' ' : `{${key}}`);
        expect(view.emitted().close).toHaveLength(1);
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
                    <Banner>{{ description: () => 'hello' }}</Banner>
                    <button type="button">after</button>
                </div>
            ),
            { container: mount }
        );
        try {
            (shadow.querySelector('button[aria-label]') as HTMLElement).focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(shadow.activeElement).toHaveTextContent('after'));
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
