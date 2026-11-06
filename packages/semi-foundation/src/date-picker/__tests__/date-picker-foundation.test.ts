import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import DatePickerFoundation, { type DatePickerAdapter, type DatePickerFoundationProps, type DatePickerFoundationState } from '../foundation';

// Only the adapter members the focus-record paths call
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
        focusRangeInput: vi.fn<DatePickerAdapter['focusRangeInput']>(),
        switchPanels: vi.fn<DatePickerAdapter['switchPanels']>(),
        notifyFocus: vi.fn<DatePickerAdapter['notifyFocus']>(),
        notifyBlur: vi.fn<DatePickerAdapter['notifyBlur']>(),
        setInsetInputFocus: vi.fn<DatePickerAdapter['setInsetInputFocus']>(),
        notifyOpenChange: vi.fn<DatePickerAdapter['notifyOpenChange']>(),
        notifyChange: vi.fn<DatePickerAdapter['notifyChange']>(),
        notifyConfirm: vi.fn<DatePickerAdapter['notifyConfirm']>(),
        notifyClear: vi.fn<DatePickerAdapter['notifyClear']>(),
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

    it('聚焦范围输入框时立即记录，并聚焦对应的 DOM 输入框', () => {
        const { foundation, adapter, records } = createFoundation();
        foundation.handleInputFocus({}, 'rangeStart');
        expect(records()).toEqual({ rangeStart: true, rangeEnd: false });
        expect(adapter.getState('rangeInputFocus')).toBe('rangeStart');
        expect(adapter.focusRangeInput).toHaveBeenCalledWith('rangeStart');
    });

    it('关闭面板清除记录，包括关闭前键盘归还焦点时写入的记录', () => {
        const { foundation, records } = createFoundation();
        foundation.handleInputFocus({}, 'rangeStart');
        // a keyboard close returns the focus to an input before closing
        foundation.focus('rangeEnd');
        foundation.close();
        expect(records()).toEqual({ rangeStart: false, rangeEnd: false });
    });

    it('受控 open 变为 false 时同样清除记录', () => {
        const { foundation, records } = createFoundation({ type: 'dateRange', open: false });
        foundation.handleInputFocus({}, 'rangeStart');
        foundation.focus('rangeEnd');
        foundation.handlePropsChange({ open: true });
        expect(records()).toEqual({ rangeStart: false, rangeEnd: false });
    });

    it('选完一端后焦点移到 nextRangeInputFocus；是否关闭面板按移动前的记录判断', () => {
        const { foundation, adapter, records } = createFoundation({ type: 'dateRange', disabledDate: () => false });
        foundation.handleInputFocus({}, 'rangeStart');
        foundation.handleSelectedChange([new Date(2021, 5, 1), new Date(2021, 5, 2)], { nextRangeInputFocus: 'rangeEnd' });
        expect(adapter.getState('rangeInputFocus')).toBe('rangeEnd');
        expect(adapter.focusRangeInput).toHaveBeenLastCalledWith('rangeEnd');
        expect(records()).toEqual({ rangeStart: true, rangeEnd: true });
        expect(adapter.notifyOpenChange).not.toHaveBeenCalled();

        foundation.handleSelectedChange([new Date(2021, 5, 1), new Date(2021, 5, 3)]);
        expect(adapter.notifyOpenChange).toHaveBeenCalledWith(false);
    });

    it('插入式输入框聚焦时切换两侧面板的日期或时间视图', () => {
        const { foundation, adapter } = createFoundation({ type: 'dateTimeRange', insetInput: true });
        foundation.handleInsetTimeFocus();
        expect(adapter.switchPanels).toHaveBeenLastCalledWith('time');
        foundation.handleInsetDateFocus({}, 'rangeEnd');
        expect(adapter.switchPanels).toHaveBeenLastCalledWith('date');
        expect(adapter.getState('rangeInputFocus')).toBe('rangeEnd');
    });

    it('isSelectionControlled：有 value 且无确认步骤时选中的日期由 value 决定', () => {
        expect(DatePickerFoundation.isSelectionControlled({ type: 'dateRange', value: [] })).toBe(true);
        expect(DatePickerFoundation.isSelectionControlled({ type: 'dateRange' })).toBe(false);
        expect(DatePickerFoundation.isSelectionControlled({ type: 'dateTime', value: null, needConfirm: true })).toBe(false);
        expect(DatePickerFoundation.isSelectionControlled({ type: 'date', value: null, needConfirm: true })).toBe(true);
    });

    it('面板打开后立即关闭，触发框保持可用', () => {
        const { foundation, adapter } = createFoundation({ type: 'date', insetInput: true });
        foundation.handlePanelVisibleChange(true);
        foundation.handlePanelVisibleChange(false);
        vi.runAllTimers();
        expect(adapter.getState('triggerDisabled')).toBe(false);
    });

    it('点击自定义范围触发器立即聚焦起始输入框，不留下定时器', () => {
        const { foundation, adapter } = createFoundation({ type: 'dateRange', customTrigger: true });
        const event = { target: null, currentTarget: null, detail: 1 };
        foundation.handleTriggerClick(event);
        expect(adapter.notifyFocus).toHaveBeenCalledWith(event, 'rangeStart');
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('DatePickerFoundation 范围值的完整性', () => {
    const disabledDate = () => false;

    it('只有一个日期的范围不算完整：选中时不写入 value、不触发 onChange', () => {
        const { foundation, adapter } = createFoundation({ type: 'dateRange', disabledDate });
        foundation.handleSelectedChange([new Date(2021, 5, 1)], { needCheckFocusRecord: false });
        expect(adapter.getState('value')).toEqual([]);
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
        foundation.handleInputChange('2021-06');
        expect(adapter.getState('value')).toEqual([]);
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

describe('DatePickerFoundation 面板打开时被禁用', () => {
    it('只关闭面板并上报 openChange(false)，键盘焦点在面板内也不发 blur、不归还焦点', () => {
        const { foundation, adapter } = createFoundation({ type: 'dateRange', disabled: true });
        vi.mocked(adapter.isKeyboardFocusInPanel).mockReturnValue(true);
        adapter.setState({ panelShow: true, inputValue: '2021-06' });
        foundation.focus('rangeEnd');
        foundation.handlePropsChange({ disabled: false });
        expect(adapter.getState('panelShow')).toBe(false);
        expect(adapter.notifyOpenChange).toHaveBeenCalledWith(false);
        expect(adapter.getState('rangeInputFocus')).toBe(false);
        expect(adapter.getState('inputValue')).toBeNull();
        expect(adapter.notifyBlur).not.toHaveBeenCalled();
        expect(adapter.setInputFocus).not.toHaveBeenCalled();
        expect(adapter.setTriggerFocus).not.toHaveBeenCalled();
    });

    it('getPosition 未指定时按方向给默认值，指定后原样返回', () => {
        expect(DatePickerFoundation.getPosition(undefined, 'rtl')).toBe('bottomRight');
        expect(DatePickerFoundation.getPosition(undefined, 'ltr')).toBe('bottomLeft');
        expect(DatePickerFoundation.getPosition('leftTopOver', 'rtl')).toBe('leftTopOver');
    });

    it('受控 open 时不改面板状态，只上报 openChange(false)', () => {
        const { foundation, adapter } = createFoundation({ type: 'date', open: true, disabled: true });
        foundation.handlePropsChange({ open: true, disabled: false });
        expect(adapter.getState('panelShow')).toBeUndefined();
        expect(adapter.notifyOpenChange).toHaveBeenCalledWith(false);
        expect(adapter.notifyBlur).not.toHaveBeenCalled();
    });
});
