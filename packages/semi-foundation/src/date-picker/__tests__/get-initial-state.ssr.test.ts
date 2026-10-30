import { expect, it, vi } from 'vite-plus/test';
import DatePickerFoundation from '../foundation';

it('node 环境下 getInitialState 不留下定时器', () => {
    vi.useFakeTimers();
    try {
        DatePickerFoundation.getInitialState({ type: 'dateRange', value: ['2024-05-06', '2024-05-09'], format: 'yyyy-MM-dd', triggerRender: () => null });
        expect(vi.getTimerCount()).toBe(0);

        DatePickerFoundation.getInitialState({ type: 'dateRange', value: [], triggerRender: () => null });
        expect(vi.getTimerCount()).toBe(0);
    } finally {
        vi.useRealTimers();
    }
});
