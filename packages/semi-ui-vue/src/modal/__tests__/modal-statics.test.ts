import { describe, expect, it, vi } from 'vite-plus/test';

describe('Modal 静态方法', () => {
    it('只导入组件文件时不加载 confirm 模块', async () => {
        vi.resetModules();
        const confirmLoaded = vi.fn<() => void>();
        vi.doMock('../confirm', () => {
            confirmLoaded();
            return {};
        });
        const { default: ModalBase } = await import('../modal.vue');
        expect(typeof ModalBase).toBe('object');
        expect(confirmLoaded).not.toHaveBeenCalled();
        vi.doUnmock('../confirm');
    }, 30000);

    it('modal/index 导出的 Modal 带全部静态方法与 install', async () => {
        vi.resetModules();
        const { default: Modal } = await import('../index');
        for (const key of ['useModal', 'info', 'success', 'error', 'warning', 'confirm', 'destroyAll', 'install'] as const) {
            expect(typeof Modal[key]).toBe('function');
        }
    }, 30000);
});
