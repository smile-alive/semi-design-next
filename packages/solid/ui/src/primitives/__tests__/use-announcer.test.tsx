import { render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { ANNOUNCE_DELAY, ANNOUNCE_HOLD } from '@fibrae/semi-foundation/utils/announcer';
import useAnnouncer from '../use-announcer';

describe('useAnnouncer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    const setup = () => {
        let handle!: ReturnType<typeof useAnnouncer>;
        const view = render(() => {
            handle = useAnnouncer();
            return <output>{handle[0]()}</output>;
        });
        return { view, handle: () => handle };
    };

    it('延迟写入常驻区域，保留一段时间后清空', () => {
        const { view, handle } = setup();
        handle()[1].announce('a', () => 'saved');
        expect(view.getByRole('status')).toHaveTextContent('');

        vi.advanceTimersByTime(ANNOUNCE_DELAY);
        expect(view.getByRole('status')).toHaveTextContent('saved');

        vi.advanceTimersByTime(ANNOUNCE_HOLD);
        expect(view.getByRole('status')).toHaveTextContent('');
    });

    it('卸载后丢弃尚未写入的消息', () => {
        const { view, handle } = setup();
        const announcer = handle()[1];
        announcer.announce('a', () => 'late');
        expect(vi.getTimerCount()).toBeGreaterThan(0);
        view.unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
