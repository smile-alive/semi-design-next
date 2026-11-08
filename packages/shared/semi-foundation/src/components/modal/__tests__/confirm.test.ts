import { describe, expect, it, vi } from 'vite-plus/test';
import { resolveConfirmProps, settleConfirm } from '../confirm';

function setup() {
    return { setLoading: vi.fn<(loading: boolean) => void>(), close: vi.fn<() => void>() };
}

describe('settleConfirm', () => {
    it('非 Promise 结果立即关闭', () => {
        const handlers = setup();
        settleConfirm(undefined, handlers);
        expect(handlers.close).toHaveBeenCalledTimes(1);
        expect(handlers.setLoading).not.toHaveBeenCalled();
    });

    it('Promise resolve 后关闭并结束 loading', async () => {
        const handlers = setup();
        const result = Promise.resolve();
        settleConfirm(result, handlers);
        expect(handlers.setLoading).toHaveBeenLastCalledWith(true);
        expect(handlers.close).not.toHaveBeenCalled();
        await result;
        expect(handlers.close).toHaveBeenCalledTimes(1);
        expect(handlers.setLoading).toHaveBeenLastCalledWith(false);
    });

    it('Promise reject 后保持打开并结束 loading', async () => {
        const handlers = setup();
        const result = Promise.reject(new Error('rejected'));
        settleConfirm(result, handlers);
        await result.catch(() => {});
        expect(handlers.close).not.toHaveBeenCalled();
        expect(handlers.setLoading).toHaveBeenLastCalledWith(false);
    });
});

describe('resolveConfirmProps', () => {
    it('丢弃显式的 undefined', () => {
        expect(resolveConfirmProps<{ title?: string; icon?: string; okButtonProps?: object }>('info', { title: 'a', icon: undefined })).toEqual({ title: 'a' });
    });

    it('error 类型的确定按钮默认 danger，使用方的 type 优先', () => {
        expect(resolveConfirmProps('error', { okButtonProps: { type: undefined, disabled: true } })).toEqual({ okButtonProps: { type: 'danger', disabled: true } });
        expect(resolveConfirmProps('error', {})).toEqual({ okButtonProps: { type: 'danger' } });
        expect(resolveConfirmProps('error', { okButtonProps: { type: 'primary' } })).toEqual({ okButtonProps: { type: 'primary' } });
    });

    it('其他类型不改按钮类型', () => {
        expect(resolveConfirmProps('warning', { okButtonProps: { disabled: true } })).toEqual({ okButtonProps: { disabled: true } });
    });
});
