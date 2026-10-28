import { expect, it, vi } from 'vite-plus/test';
import DatePickerFoundation from '../foundation';

it('node 环境下受控的字符串 value 解析为对应的 Date，且不留下定时器', () => {
    vi.useFakeTimers();
    try {
        const state = DatePickerFoundation.getInitialState({ type: 'dateRange', value: ['2024-05-06', '2024-05-09'], format: 'yyyy-MM-dd', triggerRender: () => null });
        expect(state.value).toEqual([new Date(2024, 4, 6), new Date(2024, 4, 9)]);
        expect(state.cachedSelectedValue).toEqual(state.value);
        expect(vi.getTimerCount()).toBe(0);

        const empty = DatePickerFoundation.getInitialState({ type: 'dateRange', value: [], triggerRender: () => null });
        expect(empty.rangeInputFocus).toBe('rangeStart');
        expect(vi.getTimerCount()).toBe(0);
    } finally {
        vi.useRealTimers();
    }
});
