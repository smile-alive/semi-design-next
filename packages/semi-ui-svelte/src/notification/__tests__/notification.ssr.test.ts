import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import NotificationListStore from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { Notification } from '../index';
import type { NotificationHookApi } from '../interface';
import Notice from '../notice.svelte';
import NotificationList from '../notification-list.svelte';
import HookHost from './hook-host.svelte';

describe('Svelte Notification 服务端首帧', () => {
    it('单条通知首帧带角色、标题关联、类型图标与内容', () => {
        const { body } = render(Notice, { props: { placement: 'topRight', title: 'saved', content: 'all stored', type: 'success' } });
        expect(body).toContain('role="status"');
        expect(body).toContain('aria-labelledby="semi-notification-notice-title-');
        expect(body).toContain('semi-notification-notice-success');
        expect(body).toContain('semi-icon-tick_circle');
        expect(body).toContain('saved');
        expect(body).toContain('all stored');
        expect(body).toContain(`aria-label="${zh_CN.Notification.close}"`);
    });

    it('列表首帧只有常驻播报区，没有通知', () => {
        const { body } = render(NotificationList, { props: { store: new NotificationListStore() } });
        expect(body).toContain('aria-live="polite"');
        expect(body).not.toContain('role="status"');
    });

    it('useNotification 在服务端可以初始化，调用 api 抛出带说明的错误', () => {
        let api!: NotificationHookApi;
        // the component runs its setup when the body is read
        void render(HookHost, { props: { onApi: (notification: NotificationHookApi) => (api = notification) } }).body;
        expect(() => api.info({ title: 'x' })).toThrow(/can only be called in the browser/);
    });

    it('静态方法在服务端抛出带说明的错误', () => {
        expect(() => Notification.info({ title: 'x' })).toThrow(/can only be called in the browser/);
    });
});
