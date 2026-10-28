import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import DatePickerFoundation, { type DatePickerAdapter, type DatePickerFoundationProps, type DatePickerFoundationState } from '../foundation';

// Only the adapter members the focus-record paths call; DOM focus is reduced to storing rangeInputFocus
function createFoundation(props: DatePickerFoundationProps = { type: 'dateRange' }) {
    let state = {
        value: [],
        cachedSelectedValue: [],
        rangeInputFocus: false,
        focusRecords: { rangeStart: false, rangeEnd: false },
    } as Partial<DatePickerFoundationState>;
    const adapter = {
        getProp: (key) => props[key],
        getProps: () => props,
        getState: (key) => state[key],
        getStates: () => state,
        setState: (partial) => {
            state = { ...state, ...partial };
        },
        setRangeInputFocus: (rangeInputFocus) => {
            state = { ...state, rangeInputFocus };
        },
        togglePanel: vi.fn<DatePickerAdapter['togglePanel']>(),
        notifyFocus: vi.fn<DatePickerAdapter['notifyFocus']>(),
        notifyBlur: vi.fn<DatePickerAdapter['notifyBlur']>(),
        updateInputValue: vi.fn<DatePickerAdapter['updateInputValue']>(),
        updateInsetInputValue: vi.fn<DatePickerAdapter['updateInsetInputValue']>(),
        updateCachedSelectedValue: vi.fn<DatePickerAdapter['updateCachedSelectedValue']>(),
        setTriggerDisabled: vi.fn<DatePickerAdapter['setTriggerDisabled']>(),
        setInsetInputFocus: vi.fn<DatePickerAdapter['setInsetInputFocus']>(),
        isEventTarget: () => true,
        notifyOpenChange: vi.fn<DatePickerAdapter['notifyOpenChange']>(),
        notifyChange: vi.fn<DatePickerAdapter['notifyChange']>(),
        notifyConfirm: vi.fn<DatePickerAdapter['notifyConfirm']>(),
        notifyClear: vi.fn<DatePickerAdapter['notifyClear']>(),
        updateValue: vi.fn<DatePickerAdapter['updateValue']>(),
        isKeyboardFocusInPanel: vi.fn<DatePickerAdapter['isKeyboardFocusInPanel']>(() => false),
        setInputFocus: vi.fn<DatePickerAdapter['setInputFocus']>(),
        setTriggerFocus: vi.fn<DatePickerAdapter['setTriggerFocus']>(),
    } as unknown as DatePickerAdapter;
    const foundation = new DatePickerFoundation(adapter);
    return { foundation, adapter, records: () => state.focusRecords };
}

describe('DatePickerFoundation 范围输入框的聚焦记录', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('聚焦范围输入框后在下一个任务里记录，并据此判断另一个输入框是否聚焦过', () => {
        const { foundation, records } = createFoundation();
        foundation.handleInputFocus({}, 'rangeStart');
        expect(records()).toEqual({ rangeStart: false, rangeEnd: false });
        vi.runAllTimers();
        expect(records()).toEqual({ rangeStart: true, rangeEnd: false });
        expect(foundation.hasOtherRangeInputBeenFocused('rangeEnd')).toBe(true);
        expect(foundation.hasOtherRangeInputBeenFocused('rangeStart')).toBe(false);
    });

    it('关闭面板清除记录，并丢弃关闭前尚未写入的记录', () => {
        const { foundation, records } = createFoundation();
        foundation.handleInputFocus({}, 'rangeStart');
        vi.runAllTimers();
        // a keyboard close returns the focus to an input before closing
        foundation.focus('rangeEnd');
        foundation.close();
        vi.runAllTimers();
        expect(records()).toEqual({ rangeStart: false, rangeEnd: false });
    });

    it('受控 open 变为 false 时同样清除记录与尚未写入的记录', () => {
        const { foundation, records } = createFoundation();
        foundation.handleInputFocus({}, 'rangeStart');
        vi.runAllTimers();
        foundation.handleSetRangeFocus('rangeEnd');
        foundation.handleControlledClose();
        vi.runAllTimers();
        expect(records()).toEqual({ rangeStart: false, rangeEnd: false });
    });

    it('面板打开后立即关闭，触发框保持可用', () => {
        const { foundation, adapter } = createFoundation({ type: 'date', insetInput: true });
        foundation.handlePanelVisibleChange(true);
        foundation.handlePanelVisibleChange(false);
        vi.runAllTimers();
        expect(adapter.setTriggerDisabled).toHaveBeenLastCalledWith(false);
    });

    it('点击范围触发器外层立即聚焦起始输入框，不留下卸载后才执行的定时器', () => {
        const { foundation, adapter } = createFoundation({ type: 'dateRange' });
        foundation.handleTriggerWrapperClick({});
        expect(adapter.notifyFocus).toHaveBeenCalledWith({}, 'rangeStart');
        foundation.destroy();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('destroy 丢弃尚未写入的记录', () => {
        const { foundation, records } = createFoundation();
        foundation.handleSetRangeFocus('rangeEnd');
        foundation.destroy();
        vi.runAllTimers();
        expect(records()).toEqual({ rangeStart: false, rangeEnd: false });
    });
});

describe('DatePickerFoundation 范围值的完整性', () => {
    const disabledDate = () => false;

    it('只有一个日期的范围不算完整：选中时不写入 value、不触发 onChange', () => {
        const { foundation, adapter } = createFoundation({ type: 'dateRange', disabledDate });
        foundation.handleSelectedChange([new Date(2021, 5, 1)], { needCheckFocusRecord: false });
        expect(adapter.updateValue).not.toHaveBeenCalled();
        expect(adapter.notifyChange).not.toHaveBeenCalled();
    });

    it('只有一个日期的范围点确认时回到原值，不触发 onConfirm', () => {
        const { foundation, adapter } = createFoundation({ type: 'dateTimeRange', needConfirm: true, disabledDate });
        adapter.setState({ cachedSelectedValue: [new Date(2021, 5, 1)] });
        foundation.handleConfirm();
        expect(adapter.notifyConfirm).not.toHaveBeenCalled();
    });

    it('输入框只输入范围的一端时只更新输入框文本，不写入 value', () => {
        const { foundation, adapter } = createFoundation({ type: 'monthRange', format: 'yyyy-MM', disabledDate });
        foundation.handleInputChange('2021-06', new Event('input'));
        expect(adapter.updateValue).not.toHaveBeenCalled();
        expect(adapter.notifyChange).not.toHaveBeenCalled();
    });

    it('清空范围仍算完整，触发 onChange([])', () => {
        const { foundation, adapter } = createFoundation({ type: 'dateRange', disabledDate });
        adapter.setState({ value: [new Date(2021, 5, 1), new Date(2021, 5, 2)], cachedSelectedValue: [new Date(2021, 5, 1), new Date(2021, 5, 2)] });
        foundation.handleRangeInputClear({});
        expect(adapter.notifyChange).toHaveBeenCalledWith([], []);
    });
});

describe('DatePickerFoundation.normalizeProps', () => {
    it('format 不含时间时 dateTime 类型降为日期类型，分隔符两侧补空格', () => {
        expect(DatePickerFoundation.normalizeProps({ type: 'dateTimeRange', format: 'yyyy-MM-dd', rangeSeparator: '~' })).toMatchObject({ type: 'dateRange', rangeSeparator: ' ~ ' });
        expect(DatePickerFoundation.normalizeProps({ type: 'dateTime', format: 'yyyy-MM-dd HH:mm' })).toMatchObject({ type: 'dateTime' });
    });

    it('insetInput 默认 leftTopOver 与 1px 间距；不开 insetInput 时 position 原样返回', () => {
        expect(DatePickerFoundation.normalizeProps({ insetInput: true })).toMatchObject({ position: 'leftTopOver', spacing: 1 });
        expect(DatePickerFoundation.normalizeProps({ insetInput: true, spacing: 0 })).toMatchObject({ spacing: 1 });
        expect(DatePickerFoundation.normalizeProps({ insetInput: true, position: 'bottomLeft', spacing: 0 })).toMatchObject({ position: 'bottomLeft', spacing: 0 });
        expect(DatePickerFoundation.normalizeProps({ insetInput: true, spacing: 8 })).toMatchObject({ spacing: 8 });
        expect(DatePickerFoundation.normalizeProps({})).toEqual({ type: undefined, rangeSeparator: undefined, position: undefined, spacing: 4 });
    });
});

describe('DatePickerFoundation deactivate', () => {
    it('只关闭面板并上报 openChange(false)，键盘焦点在面板内也不发 blur、不归还焦点', () => {
        const { foundation, adapter } = createFoundation({ type: 'dateRange' });
        vi.mocked(adapter.isKeyboardFocusInPanel).mockReturnValue(true);
        foundation.handleSetRangeFocus('rangeEnd');
        foundation.deactivate();
        expect(adapter.togglePanel).toHaveBeenCalledWith(false);
        expect(adapter.notifyOpenChange).toHaveBeenCalledWith(false);
        expect(adapter.getState('rangeInputFocus')).toBe(false);
        expect(adapter.updateInputValue).toHaveBeenCalledWith(null);
        expect(adapter.notifyBlur).not.toHaveBeenCalled();
        expect(adapter.setInputFocus).not.toHaveBeenCalled();
        expect(adapter.setTriggerFocus).not.toHaveBeenCalled();
    });

    it('受控 open 时不改面板状态，只上报 openChange(false)', () => {
        const { foundation, adapter } = createFoundation({ type: 'date', open: true });
        foundation.deactivate();
        expect(adapter.togglePanel).not.toHaveBeenCalled();
        expect(adapter.notifyOpenChange).toHaveBeenCalledWith(false);
        expect(adapter.notifyBlur).not.toHaveBeenCalled();
    });
});
