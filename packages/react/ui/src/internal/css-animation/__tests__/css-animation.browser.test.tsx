import { waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Notification, Toast } from '@fibrae/semi-ui-react';

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
});
