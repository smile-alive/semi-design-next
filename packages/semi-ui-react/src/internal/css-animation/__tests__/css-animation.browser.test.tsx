import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Modal, Notification, SideSheet, TabPane, Tabs, Toast } from '@fibrae/semi-ui-react';

describe('CSSAnimation（浏览器）', () => {
    let style: HTMLStyleElement | null = null;
    afterEach(() => {
        style?.remove();
        Toast.destroyAll();
        Notification.destroyAll();
    });

    const disableAnimations = () => {
        style = document.createElement('style');
        style.textContent = '* { animation: none !important; }';
        document.head.append(style);
    };

    it('页面关闭了动画（animation: none）时，Toast 到时仍会离场卸载', async () => {
        disableAnimations();
        Toast.info({ content: 'no motion', duration: 0.1 });
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-toast`)).not.toBeNull());
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-toast`)).toBeNull(), { timeout: 2000 });
    });

    it('页面关闭了动画（animation: none）时，Notification 到时仍会离场卸载', async () => {
        disableAnimations();
        Notification.info({ content: 'no motion', duration: 0.1 });
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-notification-notice`)).not.toBeNull());
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-notification-notice`)).toBeNull(), { timeout: 2000 });
    });

    it('页面关闭了动画（animation: none）时，Modal 关闭后卸载', async () => {
        disableAnimations();
        const { rerender } = render(<Modal title="Dialog" visible />);
        await screen.findByRole('dialog', { name: 'Dialog' });
        rerender(<Modal title="Dialog" visible={false} />);
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('页面关闭了动画（animation: none）时，SideSheet 关闭后卸载', async () => {
        disableAnimations();
        const { rerender } = render(<SideSheet title="Sheet" visible />);
        await screen.findByRole('dialog', { name: 'Sheet' });
        rerender(<SideSheet title="Sheet" visible={false} />);
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('页面关闭了动画（animation: none）时，Tabs 切换后面板不保留滑入 class', async () => {
        disableAnimations();
        render(
            <Tabs>
                <TabPane itemKey="a" tab="A">
                    a
                </TabPane>
                <TabPane itemKey="b" tab="B">
                    b
                </TabPane>
            </Tabs>
        );
        await userEvent.click(screen.getByRole('tab', { name: 'B' }));
        const overlay = screen.getByRole('tabpanel', { name: 'B' }).firstElementChild;
        await waitFor(() => expect(overlay?.className).toBe(`${BASE_CLASS_PREFIX}-tabs-pane-motion-overlay`));
    });
});
