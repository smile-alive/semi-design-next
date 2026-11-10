import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { zh_CN } from '@fibrae/semi-ui-svelte/locale';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import BannerFixture from './banner-fixture.svelte';

function setup(props = {}, neighbors = false, container?: HTMLElement) {
    const store = createStore({ props, description: true, neighbors });
    return render(BannerFixture, { props: { store }, ...(container ? { target: container } : {}) });
}

describe('Svelte Banner（浏览器）', () => {
    it('具名关闭按钮是 Tab 停靠点，并显示主题焦点环', async () => {
        setup();
        const close = screen.getByRole('button', { name: zh_CN.Banner.close });
        await tabTo(close);
        expectThemeFocusRing(close);
    });

    it.each([['{Enter}'], [' ']])('关闭按钮上的 %j 会关闭 Banner 并调用 onClose', async (key) => {
        const onClose = vi.fn<(event: MouseEvent) => void>();
        setup({ onClose });
        await tabTo(screen.getByRole('button', { name: zh_CN.Banner.close }));
        await userEvent.keyboard(key);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('D')).toBeNull();
    });

    it('ShadowRoot 内关闭 Banner 后焦点移到同一 ShadowRoot 内的下一个可聚焦元素', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = setup({}, true, mount);
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
