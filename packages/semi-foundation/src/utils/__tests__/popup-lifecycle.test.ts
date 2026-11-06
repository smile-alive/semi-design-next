import { describe, expect, it, vi } from 'vite-plus/test';
import PopupLifecycle from '../popup-lifecycle';

describe('PopupLifecycle', () => {
    it('一次显示只报告一次打开与一次关闭', () => {
        const lifecycle = new PopupLifecycle();
        const afterOpen = vi.fn<() => void>();
        const afterClose = vi.fn<() => void>();

        lifecycle.show();
        lifecycle.entered(afterOpen);
        lifecycle.entered(afterOpen);
        lifecycle.ended(afterClose);
        lifecycle.ended(afterClose);

        expect(afterOpen).toHaveBeenCalledTimes(1);
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('没有显示过时不报告关闭', () => {
        const lifecycle = new PopupLifecycle();
        const afterClose = vi.fn<() => void>();

        lifecycle.ended(afterClose);

        expect(afterClose).not.toHaveBeenCalled();
    });

    it('进场前结束的显示不再报告打开', () => {
        const lifecycle = new PopupLifecycle();
        const afterOpen = vi.fn<() => void>();

        lifecycle.show();
        lifecycle.ended(() => {});
        lifecycle.entered(afterOpen);

        expect(afterOpen).not.toHaveBeenCalled();
    });

    it('离场中重新打开只欠一次关闭', () => {
        const lifecycle = new PopupLifecycle();
        const afterClose = vi.fn<() => void>();

        lifecycle.show();
        lifecycle.show();
        lifecycle.ended(afterClose);
        lifecycle.ended(afterClose);

        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('每次新的显示重新欠一次打开与关闭', () => {
        const lifecycle = new PopupLifecycle();
        const afterOpen = vi.fn<() => void>();
        const afterClose = vi.fn<() => void>();

        for (let i = 0; i < 2; i++) {
            lifecycle.show();
            lifecycle.entered(afterOpen);
            lifecycle.ended(afterClose);
        }

        expect(afterOpen).toHaveBeenCalledTimes(2);
        expect(afterClose).toHaveBeenCalledTimes(2);
    });
});
