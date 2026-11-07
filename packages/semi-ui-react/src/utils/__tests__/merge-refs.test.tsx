import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { mergeRefs } from '../merge-refs';

describe('mergeRefs', () => {
    it('函数、对象、null、undefined 混合时都能收到值', () => {
        const fn = vi.fn<(instance: object | null) => void>();
        const obj = { current: null };
        const merged = mergeRefs([fn, obj, null, undefined]);
        const node = {};
        merged(node);
        expect(fn).toHaveBeenCalledWith(node);
        expect(obj.current).toBe(node);
    });

    it('按顺序调用各函数 ref 的 cleanup，且各调用一次', () => {
        const order: string[] = [];
        const a = vi.fn<() => () => void>(() => () => {
            order.push('a');
        });
        const b = vi.fn<() => () => void>(() => () => {
            order.push('b');
        });
        const cleanup = mergeRefs([a, b])({});
        expect(order).toEqual([]);
        cleanup();
        expect(order).toEqual(['a', 'b']);
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
    });

    it('没有返回 cleanup 的函数 ref 在清理时收到 null', () => {
        const fn = vi.fn<(instance: object | null) => void>();
        const cleanup = mergeRefs([fn])({});
        cleanup();
        expect(fn.mock.calls).toEqual([[{}], [null]]);
    });

    it('对象 ref 在清理时置 null', () => {
        const obj = { current: null };
        const cleanup = mergeRefs([obj])({});
        cleanup();
        expect(obj.current).toBeNull();
    });

    it('挂到 DOM 上：卸载时走 cleanup 而不是以 null 再调用', () => {
        const cleanupSpy = vi.fn<() => void>();
        const withCleanup = vi.fn<() => () => void>(() => cleanupSpy);
        const plain = vi.fn<(instance: HTMLDivElement | null) => void>();
        const obj = { current: null };
        const { unmount } = render(<div ref={mergeRefs([withCleanup, plain, obj])} />);
        expect(obj.current).toBeInstanceOf(HTMLDivElement);
        unmount();
        expect(withCleanup).toHaveBeenCalledTimes(1);
        expect(cleanupSpy).toHaveBeenCalledTimes(1);
        expect(plain).toHaveBeenLastCalledWith(null);
        expect(obj.current).toBeNull();
    });
});
