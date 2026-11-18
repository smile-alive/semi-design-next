import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { ANNOUNCE_DELAY, ANNOUNCE_HOLD, announce } from '../announcer';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '../layer';

const region = (politeness: string) => document.querySelector<HTMLElement>(`[aria-live="${politeness}"]`);

describe('announce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('写入 body 末尾共享的隐藏 live region，同一窗口内的消息都会读出，随后清空', () => {
        announce('已删除');
        announce('已保存');
        const polite = region('polite');
        expect(polite).toHaveAttribute(KEEP_INTERACTIVE_ATTRIBUTE);
        expect(polite).toHaveTextContent('');
        vi.advanceTimersByTime(ANNOUNCE_DELAY);
        expect(polite).toHaveTextContent('已删除 已保存');
        vi.advanceTimersByTime(ANNOUNCE_HOLD);
        expect(polite).toHaveTextContent('');
    });

    it('assertive 走单独的区域；区域被移出文档后再次播报时重新挂回', () => {
        announce('出错了', 'assertive');
        const assertive = region('assertive');
        vi.advanceTimersByTime(ANNOUNCE_DELAY);
        expect(assertive).toHaveTextContent('出错了');
        expect(region('polite')).not.toHaveTextContent('出错了');
        assertive?.remove();
        announce('再试一次', 'assertive');
        expect(region('assertive')).toBe(assertive);
    });
});
