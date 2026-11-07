import { describe, expect, it, vi } from 'vite-plus/test';
import ConfirmRegistry from '../confirm-registry';

describe('ConfirmRegistry', () => {
    it('destroyAll 按注册顺序关闭全部，并清空登记', () => {
        const registry = new ConfirmRegistry();
        const calls: string[] = [];
        registry.register(() => calls.push('a'));
        registry.register(() => calls.push('b'));
        registry.destroyAll();
        registry.destroyAll();
        expect(calls).toEqual(['a', 'b']);
    });

    it('已注销的对话框不再被关闭，关闭过程中注销自己不影响其余', () => {
        const registry = new ConfirmRegistry();
        const gone = vi.fn<() => void>();
        const second = vi.fn<() => void>();
        const unregisterGone = registry.register(gone);
        const unregisterFirst = registry.register(() => unregisterFirst());
        registry.register(second);
        unregisterGone();
        registry.destroyAll();
        expect(gone).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('各注册表互不影响', () => {
        const one = new ConfirmRegistry();
        const other = new ConfirmRegistry();
        const close = vi.fn<() => void>();
        other.register(close);
        one.destroyAll();
        expect(close).not.toHaveBeenCalled();
    });
});
