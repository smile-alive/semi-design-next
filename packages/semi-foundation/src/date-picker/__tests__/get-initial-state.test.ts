import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import DatePickerFoundation, { type DatePickerAdapter, type DatePickerFoundationProps, type DatePickerFoundationState, type Type } from '../foundation';

type InitialKeys = 'value' | 'cachedSelectedValue' | 'rangeInputFocus' | 'inputValue' | 'prevTimeZone';
const KEYS: InitialKeys[] = ['value', 'cachedSelectedValue', 'rangeInputFocus', 'inputValue', 'prevTimeZone'];

// The adapter writes of init only, over the initial state the frameworks create their components with
function stateAfterInit(props: DatePickerFoundationProps) {
    let state = {
        panelShow: false,
        isRange: false,
        inputValue: null,
        value: [],
        cachedSelectedValue: [],
        prevTimeZone: null,
        rangeInputFocus: undefined,
        autofocus: false,
        insetInputValue: null,
        triggerDisabled: undefined,
        focusRecords: { rangeStart: false, rangeEnd: false },
    } as DatePickerFoundationState;
    const set = (partial: Partial<DatePickerFoundationState>) => {
        state = { ...state, ...partial };
    };
    const adapter = {
        getProp: (key) => props[key],
        getProps: () => props,
        getState: (key) => state[key],
        getStates: () => state,
        setState: set,
        updateValue: vi.fn<DatePickerAdapter['updateValue']>((value) => set({ value })),
        updatePrevTimezone: vi.fn<DatePickerAdapter['updatePrevTimezone']>((prevTimeZone) => set({ prevTimeZone })),
        updateCachedSelectedValue: vi.fn<DatePickerAdapter['updateCachedSelectedValue']>((cachedSelectedValue) => set({ cachedSelectedValue })),
        updateInputValue: vi.fn<DatePickerAdapter['updateInputValue']>((inputValue) => set({ inputValue })),
        updateInsetInputValue: vi.fn<DatePickerAdapter['updateInsetInputValue']>(),
        setRangeInputFocus: vi.fn<DatePickerAdapter['setRangeInputFocus']>((rangeInputFocus) => set({ rangeInputFocus })),
        togglePanel: vi.fn<DatePickerAdapter['togglePanel']>(),
    } as unknown as DatePickerAdapter;
    new DatePickerFoundation(adapter).init();
    return Object.fromEntries(KEYS.map((key) => [key, state[key]]));
}

const TYPES: Type[] = ['date', 'dateRange', 'month', 'dateTime', 'dateTimeRange', 'year'];
const RANGE_TYPES: Type[] = ['dateRange', 'dateTimeRange'];
const SINGLE = new Date(2024, 4, 6, 7, 8, 9);
const START = new Date(2024, 4, 6, 7, 8, 9);
const END = new Date(2024, 4, 9, 10, 11, 12);

function valueFor(type: Type) {
    return RANGE_TYPES.includes(type) ? [START, END] : SINGLE;
}

describe('DatePickerFoundation.getInitialState', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    const cases: Array<[string, DatePickerFoundationProps]> = [];
    for (const type of TYPES) {
        cases.push([`${type} 受控 value`, { type, value: valueFor(type) }]);
        cases.push([`${type} defaultValue`, { type, defaultValue: valueFor(type) }]);
        cases.push([`${type} 无值`, { type }]);
        cases.push([`${type} 受控空数组`, { type, value: [] }]);
        cases.push([`${type} 受控 null`, { type, value: null }]);
        cases.push([`${type} 时间戳 value`, { type, value: RANGE_TYPES.includes(type) ? [START.getTime(), END.getTime()] : SINGLE.getTime() }]);
    }
    cases.push(['date IANA timeZone', { type: 'date', value: SINGLE, timeZone: 'Asia/Tokyo' }]);
    cases.push(['date 数字偏移 timeZone', { type: 'date', defaultValue: SINGLE, timeZone: 8 }]);
    cases.push(['dateRange IANA timeZone', { type: 'dateRange', value: [START, END], timeZone: 'America/New_York' }]);
    cases.push(['dateTimeRange 数字偏移 timeZone', { type: 'dateTimeRange', defaultValue: [START, END], timeZone: -5 }]);
    cases.push(['date 自定义 format 的字符串值', { type: 'date', value: '06/05/2024', format: 'dd/MM/yyyy' }]);
    cases.push(['dateTime 自定义 format 的字符串值加 timeZone', { type: 'dateTime', defaultValue: '2024-05-06 07:08', format: 'yyyy-MM-dd HH:mm', timeZone: 'Asia/Shanghai' }]);
    cases.push(['dateRange 自定义 format 的字符串值', { type: 'dateRange', value: ['2024-05-06', '2024-05-09'], format: 'yyyy-MM-dd' }]);
    cases.push(['dateRange triggerRender 且值为空', { type: 'dateRange', value: [], triggerRender: () => null }]);
    cases.push(['dateTimeRange triggerRender 且 defaultValue 为空', { type: 'dateTimeRange', defaultValue: [], triggerRender: () => null }]);
    cases.push(['dateRange triggerRender 且无值', { type: 'dateRange', triggerRender: () => null }]);
    cases.push(['dateRange triggerRender 且有值', { type: 'dateRange', value: [START, END], triggerRender: () => null }]);
    cases.push(['date triggerRender 且值为空', { type: 'date', value: [], triggerRender: () => null }]);
    cases.push(['dateTime needConfirm 受控 value', { type: 'dateTime', value: SINGLE, needConfirm: true }]);
    cases.push(['dateTime needConfirm defaultValue', { type: 'dateTime', defaultValue: SINGLE, needConfirm: true }]);
    cases.push(['dateTime needConfirm 无值', { type: 'dateTime', needConfirm: true }]);
    cases.push(['date multiple', { type: 'date', multiple: true, value: [START, END] }]);
    cases.push(['defaultValue 与 value 同时给出时取 value', { type: 'date', value: SINGLE, defaultValue: END }]);

    it.each(cases)('%s：与 init 写进状态的五个键一致', (_name, props) => {
        const actual = DatePickerFoundation.getInitialState(props);
        expect(Object.keys(actual).toSorted()).toEqual([...KEYS].toSorted());
        expect(actual).toEqual(stateAfterInit(props));
    });

    it('范围类型的自定义触发器在值为空时从 rangeStart 开始', () => {
        const state = DatePickerFoundation.getInitialState({ type: 'dateRange', value: [], triggerRender: () => null });
        expect(state.rangeInputFocus).toBe('rangeStart');
        expect(state.value).toEqual([]);
    });

    it('受控的字符串 value 按 format 解析为对应的 Date', () => {
        const state = DatePickerFoundation.getInitialState({ type: 'dateRange', value: ['2024-05-06', '2024-05-09'], format: 'yyyy-MM-dd' });
        expect(state.value).toEqual([new Date(2024, 4, 6), new Date(2024, 4, 9)]);
        expect(state.cachedSelectedValue).toEqual(state.value);
    });

    it('无值时返回框架的初始状态', () => {
        expect(DatePickerFoundation.getInitialState({ type: 'dateRange' })).toEqual({
            value: [],
            cachedSelectedValue: [],
            rangeInputFocus: undefined,
            inputValue: null,
            prevTimeZone: null,
        });
    });

    it('无法解析的值被丢弃，其余的值保留', () => {
        const state = DatePickerFoundation.getInitialState({ type: 'dateRange', value: ['not a date', END] });
        expect(state.value).toEqual([END]);
    });
});
