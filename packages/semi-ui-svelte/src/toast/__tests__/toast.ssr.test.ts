import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { Toast } from '../index';
import type { ToastHookApi } from '../interface';
import ToastList from '../toast-list.svelte';
import ToastItem from '../toast.svelte';
import HookHost from './hook-host.svelte';

describe('Svelte Toast 服务端首帧', () => {
    it('单条 Toast 首帧带角色、名称、类型图标与内容', () => {
        const { body } = render(ToastItem, { props: { content: 'saved', type: 'success' } });
        expect(body).toContain('role="status"');
        expect(body).toContain(`aria-label="${zh_CN.Toast.success}"`);
        expect(body).toContain('semi-toast-icon-success');
        expect(body).toContain('saved');
    });

    it('列表首帧只有常驻播报区，没有 Toast', () => {
        const { body } = render(ToastList, { props: { store: new ToastListStore() } });
        expect(body).toContain('aria-live="polite"');
        expect(body).not.toContain('role="status"');
    });

    it('useToast 在服务端可以初始化，调用 api 抛出带说明的错误', () => {
        let api!: ToastHookApi;
        // the component runs its setup when the body is read
        void render(HookHost, { props: { onApi: (toast: ToastHookApi) => (api = toast) } }).body;
        expect(() => api.info({ content: 'x' })).toThrow(/can only be called in the browser/);
    });

    it('静态方法在服务端抛出带说明的错误', () => {
        expect(() => Toast.info('x')).toThrow(/can only be called in the browser/);
    });
});
