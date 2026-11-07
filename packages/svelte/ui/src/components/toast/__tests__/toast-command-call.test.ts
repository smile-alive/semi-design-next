import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { Toast } from '../index';

const prefix = 'semi-toast';
const getContentText = (type: string) => document.querySelector(`.${prefix}-${type} .${prefix}-content-text`);

describe('Toast 命令式调用', () => {
    beforeEach(() => {
        // undo vitest/setup.ts freezing Date so Toast timers follow the real clock
        vi.useRealTimers();
    });
    afterEach(() => {
        Toast.destroyAll();
        Toast.resetConfig();
    });

    it('通过命令式调用关闭，且 duration = 0', async () => {
        const id = Toast.info({ content: 'close by manual', duration: 0, motion: false });
        Toast.success({ content: 'keep me', duration: 0, motion: false });
        await tick();
        const toast = document.getElementsByClassName(`${prefix}-info`);
        expect(toast).toHaveLength(1);
        Toast.close(id);
        await tick();
        expect(toast).toHaveLength(0);
        expect(getContentText('success')).toHaveTextContent(/^keep me$/);
    });

    it('同一同步块内的多次调用共用一个容器', async () => {
        Toast.info({ content: 'first', duration: 0 });
        Toast.success({ content: 'second', duration: 0 });
        await tick();
        expect(document.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(1);
        expect(getContentText('info')).toHaveTextContent(/^first$/);
        expect(getContentText('success')).toHaveTextContent(/^second$/);
        Toast.destroyAll();
        expect(document.querySelector(`.${prefix}-wrapper`)).toBeNull();
    });

    it('同一同步块内先展示后关闭，不留下残影', async () => {
        const id = Toast.info({ content: 'blink', duration: 0 });
        Toast.close(id);
        await tick();
        expect(document.querySelector(`.${prefix}-info`)).toBeNull();
    });

    it('不同类型的 Toast', async () => {
        Toast.info({ content: 'info' });
        Toast.success({ content: 'success' });
        Toast.warning({ content: 'warning' });
        Toast.error({ content: 'error' });
        await tick();
        for (const type of ['info', 'success', 'warning', 'error']) {
            expect(getContentText(type)?.textContent?.trim()).toBe(type);
        }
    });

    it('top/bottom/right/left 位置', async () => {
        Toast.info({ content: 'Hi, Bytedance dance dance', duration: 0, top: 500, left: 20, bottom: 30, right: 40 });
        await tick();
        const wrapper = document.querySelector<HTMLElement>(`.${prefix}-wrapper`) as HTMLElement;
        expect(wrapper.style).toMatchObject({ top: '500px', left: '20px', bottom: '30px', right: '40px' });

        Toast.info({ content: 'moved', duration: 0, top: 100, left: '10%' });
        await tick();
        expect(document.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(1);
        expect(wrapper.style).toMatchObject({ top: '100px', left: '10%', bottom: '30px', right: '40px' });
    });

    it('设置全局配置', async () => {
        Toast.config({ theme: 'light', duration: 0, top: 40, left: 30, bottom: 20, right: 10, zIndex: 30 });
        Toast.info('Hi, Bytedance dance');
        await tick();
        const wrapper = document.querySelector<HTMLElement>(`.${prefix}-wrapper`) as HTMLElement;
        expect(wrapper.style).toMatchObject({ top: '40px', left: '30px', bottom: '20px', right: '10px', zIndex: '30' });
        expect(document.querySelector(`.${prefix}-info`)).toHaveClass(`${prefix}-light`);
    });
});
