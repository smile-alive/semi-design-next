import { describe, expect, it, vi } from 'vite-plus/test';
import Event from '../event';

describe('Event', () => {
    it('on 按注册顺序触发，emit 返回是否有订阅者', () => {
        const event = new Event();
        const calls: string[] = [];
        event.on('a', () => calls.push('1')).on('a', () => calls.push('2'));
        expect(event.emit('a')).toBe(true);
        expect(calls).toEqual(['1', '2']);
        expect(event.emit('none')).toBe(false);
    });

    it('once 只触发一次，且不影响同事件的其他订阅者', () => {
        const event = new Event();
        const once = vi.fn<(value: number) => void>();
        const always = vi.fn<(value: number) => void>();
        expect(event.once('a', once).on('a', always)).toBe(event);
        event.emit('a', 1);
        event.emit('a', 2);
        expect(once.mock.calls).toEqual([[1]]);
        expect(always.mock.calls).toEqual([[1], [2]]);
    });

    it('emit 中注销自己或相邻订阅者不会让后面的回调被跳过', () => {
        const event = new Event();
        const calls: string[] = [];
        const first = () => {
            calls.push('first');
            event.off('a', first);
        };
        event.on('a', first);
        event.on('a', () => calls.push('second'));
        event.on('a', () => calls.push('third'));
        event.emit('a');
        expect(calls).toEqual(['first', 'second', 'third']);
        event.emit('a');
        expect(calls.slice(3)).toEqual(['second', 'third']);
    });

    it('off 带回调时移除该回调的全部注册，不带回调时清空事件', () => {
        const event = new Event();
        const fn = vi.fn<() => void>();
        const other = vi.fn<() => void>();
        event.on('a', fn).on('a', fn).on('a', other);
        event.off('a', fn);
        event.emit('a');
        expect(fn).not.toHaveBeenCalled();
        expect(other).toHaveBeenCalledTimes(1);
        event.off('a');
        expect(event.emit('a')).toBe(false);
    });

    it('空事件名或非函数回调被忽略', () => {
        const event = new Event();
        event.on('', vi.fn<() => void>());
        event.on('a', null);
        event.once('a', undefined);
        expect(event.emit('')).toBe(false);
        expect(event.emit('a')).toBe(false);
    });
});
