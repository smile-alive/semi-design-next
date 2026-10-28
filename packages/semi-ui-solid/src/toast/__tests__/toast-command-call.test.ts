import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Toast from '..';

const getContentText = (type: string) => document.querySelector(`.${BASE_CLASS_PREFIX}-toast-${type} .${BASE_CLASS_PREFIX}-toast-content-text`);

describe('Toast - 2', () => {
    beforeEach(() => {
        // undo vitest/setup.ts freezing Date so Toast timers follow the real clock
        vi.useRealTimers();
    });

    afterEach(async () => {
        Toast.destroyAll();
        Toast.resetConfig();
        // the detached tree is released in a microtask
        await Promise.resolve();
    });

    it('通过命令式调用关闭，且 duration = 0', () => {
        const id = Toast.info({ content: 'close by manual', duration: 0, motion: false });
        Toast.success({ content: 'keep me', duration: 0, motion: false });
        const toast = document.getElementsByClassName(`${BASE_CLASS_PREFIX}-toast-info`);
        expect(toast.length).toEqual(1);
        Toast.close(id);
        expect(toast.length).toEqual(0);
        expect(getContentText('success')).toHaveTextContent(/^keep me$/);
    });

    it('先后创建的 Toast 共用同一个容器，destroyAll 移除容器', () => {
        Toast.info({ content: 'first', duration: 0 });
        Toast.success({ content: 'second', duration: 0 });
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast-wrapper`)).toHaveLength(1);
        expect(getContentText('info')).toHaveTextContent(/^first$/);
        expect(getContentText('success')).toHaveTextContent(/^second$/);
        Toast.destroyAll();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-toast-wrapper`)).toBeNull();
    });

    it('destroyAll 后立即打开的 Toast 在新的容器中单独显示', () => {
        Toast.info({ content: 'old', duration: 0 });
        const oldWrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-toast-wrapper`);
        Toast.destroyAll();
        Toast.info({ content: 'new', duration: 0 });
        const wrappers = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast-wrapper`);
        expect(wrappers).toHaveLength(1);
        expect(wrappers[0]).not.toBe(oldWrapper);
        expect(wrappers[0]).toHaveTextContent(/^new$/);
    });

    it('不同类型的 Toast', () => {
        Toast.info({ content: 'info' });
        Toast.success({ content: 'success' });
        Toast.warning({ content: 'warning' });
        Toast.error({ content: 'error' });
        expect(getContentText('info')?.innerHTML).toEqual('info');
        expect(getContentText('success')?.innerHTML).toEqual('success');
        expect(getContentText('warning')?.innerHTML).toEqual('warning');
        expect(getContentText('error')?.innerHTML).toEqual('error');
    });

    it('top/bottom/right/left 位置', () => {
        Toast.info({ content: 'Hi, Bytedance dance dance', duration: 0, top: 500, left: 20, bottom: 30, right: 40 });
        const toastWrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-toast-wrapper`);
        expect(toastWrapper).toHaveStyle({ top: '500px', left: '20px', bottom: '30px', right: '40px' });

        Toast.info({ content: 'moved', duration: 0, top: 100, left: '10%' });
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast-wrapper`)).toHaveLength(1);
        expect(toastWrapper).toHaveStyle({ top: '100px', left: '10%', bottom: '30px', right: '40px' });
    });

    it('设置全局配置', () => {
        Toast.config({ theme: 'light', duration: 0, top: 40, left: 30, bottom: 20, right: 10, zIndex: 30 });
        Toast.info('Hi, Bytedance dance');
        const toastWrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-toast-wrapper`);
        expect(toastWrapper).toHaveStyle({ top: '40px', left: '30px', bottom: '20px', right: '10px', zIndex: '30' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-toast-info`)).toHaveClass(`${BASE_CLASS_PREFIX}-toast-light`);
    });
});
