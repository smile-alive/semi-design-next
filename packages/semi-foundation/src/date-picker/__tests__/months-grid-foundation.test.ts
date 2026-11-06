import { describe, expect, it, vi } from 'vite-plus/test';
import type { Locale } from '../../locale/interface';
import MonthsGridFoundation, { type PanelState, type MonthsGridAdapter, type MonthsGridFoundationProps, type MonthsGridFoundationState } from '../months-grid-foundation';

const panel = (date: Date): PanelState => ({
    pickerDate: date,
    showDate: date,
    isTimePickerOpen: true,
    isYearPickerOpen: false,
});

// Only the adapter members handleTimeChange reaches
function createFoundation(props: Partial<MonthsGridFoundationProps>, state: Partial<MonthsGridFoundationState>) {
    const adapter = {
        getProp: (key) => props[key],
        getProps: () => props,
        getState: (key) => state[key],
        getStates: () => state,
        setState: vi.fn<MonthsGridAdapter['setState']>(),
        notifySelectedChange: vi.fn<MonthsGridAdapter['notifySelectedChange']>(),
    };
    const foundation = new MonthsGridFoundation(adapter as unknown as MonthsGridAdapter);
    return { foundation, adapter };
}

describe('MonthsGridFoundation 导航与切换文本', () => {
    const locale = { monthText: '${year}年 ${month}', months: { 6: '6月' }, localeFormatToken: { FORMAT_SWITCH_DATE: 'yyyy-MM-dd' } } as unknown as Locale['DatePicker'];

    it('formatMonthText 按 locale 的模板拼出年月，没有月份时为空', () => {
        expect(MonthsGridFoundation.formatMonthText(locale, new Date(2021, 5, 1))).toBe('2021年 6月');
        expect(MonthsGridFoundation.formatMonthText(locale, undefined)).toBe('');
    });

    it('getSwitchTexts 日期取已选端点，否则取面板显示的日期', () => {
        const showDate = new Date(2021, 5, 1, 9, 30);
        const base = { showDate, dateFormat: 'yyyy-MM-dd HH:mm:ss', format: 'yyyy-MM-dd HH:mm', locale, dateFnsLocale: undefined };
        expect(MonthsGridFoundation.getSwitchTexts({ ...base, rangeEndpoint: '2021-06-15 18:00:00' })).toEqual({ date: '2021-06-15', time: '09:30' });
        expect(MonthsGridFoundation.getSwitchTexts({ ...base, rangeEndpoint: '' })).toEqual({ date: '2021-06-01', time: '09:30' });
        expect(MonthsGridFoundation.getSwitchTexts({ ...base, rangeEndpoint: '', showDate: undefined })).toEqual({ date: '', time: '' });
    });
});

describe('MonthsGridFoundation handleTimeChange', () => {
    it('dateTime 把新时间合并到面板显示的日期上', () => {
        const showDate = new Date(2019, 8, 8, 8, 8, 8, 8);
        const { foundation, adapter } = createFoundation({ type: 'dateTime', insetInput: false }, { selected: new Set(), monthLeft: panel(showDate) });
        foundation.handleTimeChange({ timeStampValue: new Date(2000, 0, 1, 14, 30, 15, 500).getTime() }, 'left');
        const merged = new Date(2019, 8, 8, 14, 30, 15, 500);
        expect(adapter.setState).toHaveBeenCalledWith({ selected: new Set(['2019-09-08']) }, undefined);
        expect(adapter.notifySelectedChange).toHaveBeenCalledWith([merged]);
        expect(adapter.setState).toHaveBeenCalledWith(
            {
                monthLeft: {
                    ...panel(showDate),
                    pickerDate: merged,
                    showDate: merged,
                },
            },
            undefined
        );
    });

    it('dateTimeRange 把新时间合并到对应端点的日期上', () => {
        const { foundation, adapter } = createFoundation(
            { type: 'dateTimeRange', insetInput: false },
            {
                rangeStart: '2021-06-01 10:00:00',
                rangeEnd: '2021-06-15 18:00:00',
                monthLeft: panel(new Date(2021, 5, 1, 10)),
                monthRight: panel(new Date(2021, 6, 1, 18)),
            }
        );
        foundation.handleTimeChange({ timeStampValue: new Date(2000, 0, 1, 20, 5).getTime() }, 'right');
        const merged = new Date(2021, 5, 15, 20, 5);
        expect(adapter.setState).toHaveBeenCalledWith({ monthRight: { ...panel(new Date(2021, 6, 1, 18)), pickerDate: merged } }, undefined);
        expect(adapter.setState).toHaveBeenCalledWith({ rangeEnd: '2021-06-15 20:05:00' }, undefined);
        expect(adapter.notifySelectedChange).toHaveBeenCalledWith([new Date(2021, 5, 1, 10), merged]);
    });

    it('dateTimeRange 端点为空时合并到面板显示的日期上，且不通知', () => {
        const showDate = new Date(2021, 6, 3, 9);
        const { foundation, adapter } = createFoundation({ type: 'dateTimeRange', insetInput: false }, { rangeStart: '2021-06-01 10:00:00', rangeEnd: '', monthLeft: panel(showDate), monthRight: panel(showDate) });
        foundation.handleTimeChange({ timeStampValue: new Date(2000, 0, 1, 7, 45, 30).getTime() }, 'right');
        expect(adapter.setState).toHaveBeenCalledWith({ monthRight: { ...panel(showDate), pickerDate: new Date(2021, 6, 3, 7, 45, 30) } }, undefined);
        expect(adapter.notifySelectedChange).not.toHaveBeenCalled();
    });
});

describe('MonthsGridFoundation 范围端点', () => {
    it('没有端点时 rangeStart 与 rangeEnd 为空串', () => {
        expect(MonthsGridFoundation.getInitialState({ type: 'dateRange', insetInput: false }).rangeStart).toBe('');
        const date = new Date(2021, 5, 1);
        for (const selectedValue of [[date], [null, date]]) {
            const { rangeStart, rangeEnd } = MonthsGridFoundation.getInitialState({ type: 'dateRange', insetInput: false, selectedValue });
            expect([rangeStart, rangeEnd]).toContain('');
            expect([rangeStart, rangeEnd]).toContain('2021-06-01');
        }
    });
});

describe('MonthsGridFoundation getPanelSizeStyle', () => {
    const date = new Date(2021, 5, 1);
    const yearOpen: PanelState = { ...panel(date), isTimePickerOpen: false, isYearPickerOpen: true };
    const dateOpen: PanelState = { ...panel(date), isTimePickerOpen: false };
    const measure = () => ({
        monthWidth: vi.fn<(panelType: 'left' | 'right') => number | null>((panelType) => (panelType === 'left' ? 280 : null)),
        scrollListHeight: vi.fn<() => number>(() => 320),
    });

    it('只打开一侧年月选择器时该侧保持月份宽度，不设 minHeight，也不量高度', () => {
        const m = measure();
        expect(MonthsGridFoundation.getPanelSizeStyle({ monthLeft: yearOpen, monthRight: dateOpen }, false, m)).toEqual({
            left: { minWidth: '280px', minHeight: '' },
            right: { minWidth: '', minHeight: '' },
        });
        expect(m.monthWidth).toHaveBeenCalledTimes(1);
        expect(m.scrollListHeight).not.toHaveBeenCalled();
    });

    it('两侧都打开滚动列表时共用 minHeight；insetInput 下不设', () => {
        const both = { monthLeft: yearOpen, monthRight: panel(date) };
        expect(MonthsGridFoundation.getPanelSizeStyle(both, false, measure())).toEqual({
            left: { minWidth: '280px', minHeight: '320px' },
            right: { minWidth: '', minHeight: '320px' },
        });
        expect(MonthsGridFoundation.getPanelSizeStyle(both, true, measure()).left.minHeight).toBe('');
    });
});
