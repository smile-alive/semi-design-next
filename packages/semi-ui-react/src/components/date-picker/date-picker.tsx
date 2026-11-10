import React, { useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import clsx from 'clsx';
import FocusTrapHandle from '@fibrae/semi-foundation/base/focus-handle';
import { cssClasses, strings, numbers } from '@fibrae/semi-foundation/components/date-picker/constants';
import DatePickerFoundation, {
    getYearMonthFromValue,
    isRangeType,
    isRangeValueComplete,
    isYearOrMonthType,
    needConfirm,
    type DatePickerAdapter,
    type DatePickerFoundationProps,
    type DatePickerFoundationState,
    type DayStatusType,
    type PresetType,
    type Type,
    type RangeInput,
    type InputSize,
    type ValueType,
} from '@fibrae/semi-foundation/components/date-picker/foundation';
import { isInnerControlKey, namedRole } from '@fibrae/semi-foundation/utils/a11y';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/components/date-picker/date-picker.scss';
import type { ElementProps } from '../../base/base';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import useClickOutside from '../../hooks/use-click-outside';
import Trigger from '../../internal/trigger';
import { useConfigContext } from '../config-provider/context';
import type { InputHandle } from '../input';
import { InputGroupContext, useInputGroupInScope, withInputGroup } from '../input/context';
import useLocale from '../locale/use-locale';
import Popover from '../popover/index';
import DateInput from './date-input';
import Footer from './footer';
import MonthsGrid, { type MonthsGridHandle, type DatePickerTimePickerOpts } from './months-grid';
import QuickControl from './quick-control';
import YearAndMonth, { type YearAndMonthOpts } from './year-and-month';

export type TriggerRenderProps = {
    [x: string]: any;
    value?: ValueType;
    inputValue?: string | null;
    placeholder?: string | string[];
    autoFocus?: boolean;
    size?: InputSize;
    disabled?: boolean;
    inputReadOnly?: boolean;
    componentProps?: DatePickerFoundationProps;
};

export interface DatePickerProps extends Omit<DatePickerFoundationProps, 'dateFnsLocale' | 'customTrigger'>, ElementProps<'div', 'prefix' | 'style' | 'defaultValue' | 'onChange' | 'onBlur' | 'onFocus'> {
    clearIcon?: React.ReactNode;
    timePickerOpts?: DatePickerTimePickerOpts;
    bottomSlot?: React.ReactNode;
    insetLabel?: React.ReactNode;
    insetLabelId?: string;
    prefix?: React.ReactNode;
    topSlot?: React.ReactNode;
    rightSlot?: React.ReactNode;
    renderDate?: (dayNumber?: number, fullDate?: string) => React.ReactNode;
    renderFullDate?: (dayNumber?: number, fullDate?: string, dayStatus?: DayStatusType) => React.ReactNode;
    triggerRender?: (props: TriggerRenderProps) => React.ReactNode;
    /**
     * Only renders the separator between range inputs; parsing and formatting still use `rangeSeparator`.
     */
    rangeSeparatorNode?: React.ReactNode;
    /**
     * Called when the panel closes; `e` is the outside mousedown that closed it, absent for other ways of closing.
     * A range has several inputs that blur repeatedly: prefer `onOpenChange` or `onClickOutSide`.
     */
    onBlur?: (e?: MouseEvent) => void;
    onClear?: React.MouseEventHandler<HTMLButtonElement>;
    /**
     * `e` is an input focus, or the click or key press on the trigger that focused the range start; `rangeType` is
     * set for range inputs only. A range has several inputs that focus repeatedly: prefer `onOpenChange` or
     * `triggerRender`.
     */
    onFocus?: (e: React.FocusEvent | React.MouseEvent | React.KeyboardEvent, rangeType?: RangeInput | false) => void;
    onPresetClick?: (item: PresetType, e: React.MouseEvent<HTMLDivElement>) => void;
    onClickOutSide?: (e: MouseEvent) => void;
    leftSlot?: React.ReactNode;
    yearAndMonthOpts?: YearAndMonthOpts;
    /** Gets arrays in range and multiple mode */
    onChange?: (date: Date | Date[], dateString: string | string[]) => void;
    /** on the root div */
    ref?: React.Ref<DatePickerHandle>;
}

export interface DatePickerHandle {
    open: () => void;
    close: () => void;
    /**
     * Focuses the input; a range focuses its start input unless `rangeEnd` is given. With `insetInput` and the panel
     * open the focus goes to the input in the panel, as the trigger is disabled.
     */
    focus: (focusType?: RangeInput) => void;
    blur: () => void;
}

export type DatePickerState = DatePickerFoundationState;

const defaultProps = {
    borderless: false,
    autoAdjustOverflow: true,
    stopPropagation: true,
    motion: true,
    presetPosition: 'bottom',
    type: 'date',
    size: 'default',
    density: 'default',
    multiple: false,
    defaultOpen: false,
    hideDisabledOptions: false,
    weekStartsOn: numbers.WEEK_START_ON,
    inputReadOnly: false,
    autoSwitchDate: true,
    syncSwitchMonth: false,
    rangeSeparator: strings.DEFAULT_SEPARATOR_RANGE,
    insetInput: false,
} satisfies Partial<DatePickerProps>;

function hasRangeInputs(type: Type, triggerRender: DatePickerProps['triggerRender']) {
    return isRangeType(type) && typeof triggerRender !== 'function';
}

export default function DatePicker(rawProps: DatePickerProps) {
    const { locale, dateFnsLocale } = useLocale('DatePicker');
    const { timeZone: contextTimeZone, direction } = useConfigContext();

    // an explicit undefined falls back like a missing prop: prop, then context, then the global default
    const defaulted = useDefaultProps('DatePicker', withInputGroup({ ...rawProps, timeZone: rawProps.timeZone ?? contextTimeZone, dateFnsLocale }, useInputGroupInScope()), defaultProps);
    const props = { ...defaulted, ...DatePickerFoundation.normalizeProps(defaulted) };

    const {
        ref,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        autoAdjustOverflow,
        autoFocus,
        autoSwitchDate,
        borderless,
        bottomSlot,
        className,
        clearIcon,
        dateFnsLocale: _dateFnsLocale,
        defaultOpen,
        defaultPickerValue,
        defaultValue,
        density,
        disabled,
        disabledDate,
        disabledTime,
        disabledTimePicker,
        dropdownClassName,
        dropdownStyle,
        endDateOffset,
        endYear,
        format,
        hideDisabledOptions,
        inputReadOnly,
        inputStyle,
        insetInput,
        insetLabel,
        insetLabelId,
        leftSlot,
        max,
        motion,
        multiple,
        needConfirm: _needConfirm,
        onBlur,
        onCancel,
        onChange,
        onClear,
        onClickOutSide,
        onConfirm,
        onFocus,
        onOpenChange,
        onPanelChange,
        onPresetClick,
        open: _open,
        placeholder,
        position: positionProp,
        prefix,
        presetPosition,
        presets,
        preventScroll,
        rangeSeparator,
        rangeSeparatorNode,
        renderDate,
        renderFullDate,
        rightSlot,
        showClear,
        size,
        spacing,
        startDateOffset,
        startYear,
        stopPropagation,
        style,
        syncSwitchMonth,
        // Tooltip adds it to its child: it belongs to the input, the Tab stop
        tabIndex,
        timePickerOpts,
        timeZone,
        topSlot,
        triggerRender,
        type,
        validateStatus,
        value: _value,
        weekStartsOn,
        yearAndMonthOpts,
        ...rest
    } = props;

    const triggerElRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const monthGridRef = useRef<MonthsGridHandle>(null);
    const inputRef = useRef<InputHandle>(null);
    const rangeInputStartRef = useRef<InputHandle>(null);
    const rangeInputEndRef = useRef<InputHandle>(null);

    // with insetInput the refs above go to the inputs in the panel, which unmount on close; focus() then needs these
    const triggerStartRef = useRef<InputHandle>(null);
    const triggerEndRef = useRef<InputHandle>(null);
    const comboboxRef = useRef<HTMLDivElement>(null);
    const panelId = useId();
    const [customTriggerFocusable, setCustomTriggerFocusable] = useState(false);

    const isConfirmNeeded = needConfirm(props);
    const position = DatePickerFoundation.getPosition(positionProp, direction);
    const isYearOrMonth = isYearOrMonthType(type);
    const isRange = hasRangeInputs(type, triggerRender);

    // a triggerRender spreading componentProps must not grab the handle
    const componentProps = { ...props };

    // customTrigger stays out of props: they reach the root div and triggerRender's componentProps
    const foundationProps = { ...props, customTrigger: typeof triggerRender === 'function' };

    // called while rendering, so they take this render's props: the foundation reads the last committed ones
    const disabledDisposeDate = (date: Date, options?: any) => DatePickerFoundation.disposeDateFn(timeZone, disabledDate, date, options);

    const disabledDisposeTime = (date: Date | Date[], panelType?: any) => DatePickerFoundation.disposeDateFn(timeZone, disabledTime, date, panelType);

    // only the rendered DOM tells whether a custom trigger has its own focus target.
    // Known limit: re-measured only when triggerRender changes; a stable one that switches between focusable and
    // plain markup needs a MutationObserver
    useEffect(() => {
        if (typeof props.triggerRender === 'function') {
            setCustomTriggerFocusable(FocusTrapHandle.getFocusableElements(comboboxRef.current).length > 0);
        }
    }, [props.triggerRender]);

    const [foundation, state] = useFoundation<DatePickerFoundation, DatePickerAdapter, DatePickerProps, DatePickerState>(
        DatePickerFoundation,
        foundationProps,
        () => DatePickerFoundation.getInitialState(foundationProps),
        (base) => {
            return {
                notifyBlur: (e) => base.getProps().onBlur?.(e),
                notifyFocus: (e, rangeType) => base.getProps().onFocus?.(e, rangeType),
                notifyClear: (e) => base.getProps().onClear?.(e),
                notifyChange: (date, dateStr) => base.getProps().onChange?.(date, dateStr),
                notifyCancel: (date, dateStr) => base.getProps().onCancel?.(date, dateStr),
                notifyConfirm: (date, dateStr) => base.getProps().onConfirm?.(date, dateStr),
                notifyOpenChange: (open) => base.getProps().onOpenChange?.(open),
                notifyClickOutSide: (e) => base.getProps().onClickOutSide?.(e),
                notifyPresetsClick: (item, e) => base.getProps().onPresetClick?.(item, e),
                focusRangeInput: (rangeInput) => {
                    const input = rangeInput === 'rangeEnd' ? (rangeInputEndRef.current ?? triggerEndRef.current) : (rangeInputStartRef.current ?? triggerStartRef.current);
                    input?.focus({ preventScroll: base.getProps().preventScroll });
                },
                switchPanels: (view) => monthGridRef.current?.switchPanels(view),
                isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panelRef.current),
                setInsetInputFocus: () => {
                    const { preventScroll } = base.getProps();
                    const input = base.getState('rangeInputFocus') === 'rangeEnd' ? rangeInputEndRef.current : rangeInputStartRef.current;
                    if (FocusTrapHandle.getActiveElement(input?.input) !== input?.input) {
                        input?.focus({ preventScroll });
                    }
                },
                setInputFocus: () => inputRef.current?.focus({ preventScroll: base.getProps().preventScroll }),
                setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(comboboxRef.current, { preventScroll: base.getProps().preventScroll }),
                blurFocusedElement: () => {
                    const active = FocusTrapHandle.getActiveElement(triggerElRef.current);
                    if (active instanceof HTMLElement && (triggerElRef.current?.contains(active) || panelRef.current?.contains(active))) {
                        active.blur();
                    }
                },
            };
        }
    );

    const panelShow = DatePickerFoundation.isPanelShown(props, state);

    const markPressInside = useClickOutside([triggerElRef, panelRef], foundation.handleClickOutside, panelShow);

    const { value, inputValue, rangeInputFocus, triggerDisabled, cachedSelectedValue, insetInputValue } = state;
    const inputDisabled = disabled || (insetInput && triggerDisabled);
    const valueLabel = value.length ? locale.changeDate : locale.chooseDate;

    // also passed to triggerRender as its public props: do not drop keys
    const inputProps = {
        ...(isRangeType(type) ? {} : { borderless }),
        showClearIgnoreDisabled: Boolean(insetInput),
        placeholder: placeholder || locale.placeholder[type],
        // APG date picker combobox: the inputs that open the panel carry the popup state
        role: 'combobox',
        'aria-controls': panelId,
        'aria-expanded': panelShow,
        'aria-haspopup': 'dialog' as const,
        'aria-labelledby': ariaLabelledby,
        // the focused input carries the field state; the roleless wrapper cannot
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-required': ariaRequired,
        'aria-label': ariaLabelledby ? undefined : valueLabel,
        clearIcon,
        locale,
        tabIndex,
        disabled: inputDisabled,
        inputValue,
        value,
        defaultPickerValue,
        onChange: foundation.handleInputChange,
        onEnterPress: (input: string) => foundation.handleInputComplete(input),
        block: true,
        inputStyle,
        showClear,
        insetLabel,
        insetLabelId,
        type,
        format,
        multiple,
        validateStatus,
        inputReadOnly: inputReadOnly || Boolean(insetInput),
        // onBlur fires when the panel closes, not on input blur
        onBlur: noop,
        onFocus: foundation.handleInputFocus,
        onClear: foundation.handleInputClear,
        prefix,
        size,
        autofocus: state.autofocus,
        dateFnsLocale,
        rangeInputFocus,
        rangeSeparator,
        rangeSeparatorNode,
        onRangeClear: foundation.handleRangeInputClear,
        onRangeEndTabPress: foundation.handleRangeEndTabPress,
        rangeInputStartRef: insetInput ? triggerStartRef : rangeInputStartRef,
        rangeInputEndRef: insetInput ? triggerEndRef : rangeInputEndRef,
        inputRef,
    };

    // null without presets: MonthsGrid sizes the panel by whether a side column exists
    const renderQuickControls = () => (presets?.length ? <QuickControl type={type} insetInput={insetInput} locale={locale} presetPosition={presetPosition} presets={presets} onPresetClick={foundation.handlePresetClick} /> : null);

    const renderDateInput = () =>
        insetInput ? (
            <DateInput
                type={type}
                value={value}
                dateFnsLocale={dateFnsLocale}
                defaultPickerValue={defaultPickerValue}
                density={density}
                format={format}
                insetInput={insetInput}
                insetInputValue={insetInputValue}
                locale={locale}
                rangeInputEndRef={rangeInputEndRef}
                rangeInputStartRef={rangeInputStartRef}
                rangeSeparator={rangeSeparator}
                rangeSeparatorNode={rangeSeparatorNode}
                timeZone={timeZone}
                handleInsetDateFocus={foundation.handleInsetDateFocus}
                handleInsetTimeFocus={foundation.handleInsetTimeFocus}
                onInsetInputChange={foundation.handleInsetInputChange}
            />
        ) : null;

    const renderMonthGrid = () => (
        <MonthsGrid
            ref={monthGridRef}
            type={type}
            max={max}
            multiple={multiple}
            autoSwitchDate={autoSwitchDate}
            dateFnsLocale={dateFnsLocale}
            defaultPickerValue={defaultPickerValue}
            density={density}
            disabledDate={disabledDisposeDate}
            disabledTime={disabledDisposeTime}
            disabledTimePicker={disabledTimePicker}
            endDateOffset={endDateOffset}
            endYear={endYear}
            focusRecords={state.focusRecords}
            format={format}
            hideDisabledOptions={hideDisabledOptions}
            insetInput={insetInput}
            locale={locale}
            presetPosition={presetPosition}
            rangeInputFocus={rangeInputFocus}
            selectedValue={cachedSelectedValue}
            selectionControlled={DatePickerFoundation.isSelectionControlled(props)}
            startDateOffset={startDateOffset}
            startYear={startYear}
            syncSwitchMonth={syncSwitchMonth}
            timePickerOpts={timePickerOpts}
            timeZone={timeZone}
            weekStartsOn={weekStartsOn}
            yearAndMonthOpts={yearAndMonthOpts}
            renderDate={renderDate}
            renderDateInput={renderDateInput()}
            renderFullDate={renderFullDate}
            renderQuickControls={renderQuickControls()}
            onChange={foundation.handleSelectedChange}
            onPanelChange={onPanelChange}
        />
    );

    const renderYearMonthPanel = () => {
        const { year, month } = getYearMonthFromValue(value, type);
        return (
            <YearAndMonth
                type={type}
                currentMonth={month}
                currentYear={year}
                density={density}
                disabledDate={disabledDisposeDate}
                endYear={endYear}
                locale={locale}
                monthCycled
                noBackBtn
                presetPosition={presetPosition}
                startYear={startYear}
                yearAndMonthOpts={yearAndMonthOpts}
                renderDateInput={renderDateInput()}
                renderQuickControls={renderQuickControls()}
                onSelect={foundation.handleYMSelectedChange}
            />
        );
    };

    const renderFooter = () => {
        if (!isConfirmNeeded) {
            return null;
        }
        return <Footer disabledConfirm={isRangeType(type) && !isRangeValueComplete(cachedSelectedValue)} locale={locale} onCancelClick={foundation.handleCancel} onConfirmClick={foundation.handleConfirm} />;
    };

    const panel = (
        <div
            ref={panelRef}
            id={panelId}
            className={clsx(
                cssClasses.PREFIX,
                {
                    [cssClasses.PANEL_YAM]: isYearOrMonth,
                    [`${cssClasses.PREFIX}-compact`]: density === 'compact',
                },
                dropdownClassName
            )}
            style={dropdownStyle}
            x-type={type}
        >
            <div className={`${cssClasses.PREFIX}-container`}>
                {leftSlot && (
                    <div className={`${cssClasses.PREFIX}-leftSlot`} x-semi-prop="leftSlot">
                        {leftSlot}
                    </div>
                )}
                <div>
                    {topSlot && (
                        <div className={`${cssClasses.PREFIX}-topSlot`} x-semi-prop="topSlot">
                            {topSlot}
                        </div>
                    )}
                    {presetPosition === 'top' && type !== 'monthRange' && renderQuickControls()}
                    {isYearOrMonth ? renderYearMonthPanel() : renderMonthGrid()}
                    {presetPosition === 'bottom' && type !== 'monthRange' && renderQuickControls()}
                    {bottomSlot && (
                        <div className={`${cssClasses.PREFIX}-bottomSlot`} x-semi-prop="bottomSlot">
                            {bottomSlot}
                        </div>
                    )}
                </div>
                {rightSlot && (
                    <div className={`${cssClasses.PREFIX}-rightSlot`} x-semi-prop="rightSlot">
                        {rightSlot}
                    </div>
                )}
            </div>
            {renderFooter()}
        </div>
    );

    useImperativeHandle(
        props.ref,
        () => ({
            open: foundation.open,
            close: () => foundation.close(),
            focus: foundation.focus,
            blur: foundation.blur,
        }),
        [foundation]
    );

    delete componentProps.ref;

    // without a focus target of its own, the custom trigger's wrapper is the Tab stop and acts as the button
    const isTriggerButton = typeof triggerRender === 'function' && !customTriggerFocusable;

    return (
        <InputGroupContext value={undefined}>
            <div
                {...rest}
                ref={triggerElRef}
                className={clsx(className, cssClasses.PREFIX)}
                style={style}
                aria-labelledby={isRange ? ariaLabelledby : undefined}
                role={isRange ? (rest.role ?? 'group') : namedRole(rest)}
                onMouseDownCapture={(e) => {
                    rest.onMouseDownCapture?.(e);
                    markPressInside(e);
                }}
            >
                <Popover
                    aria-label={locale.panel[type]}
                    afterClose={() => foundation.handlePanelVisibleChange(false)}
                    autoAdjustOverflow={autoAdjustOverflow}
                    content={panel}
                    motion={motion}
                    position={position}
                    spacing={spacing}
                    stopPropagation={stopPropagation}
                    trigger="custom"
                    visible={panelShow}
                    // custom trigger: Popover leaves Esc to the DatePicker
                    onEscKeyDown={foundation.handleEscKeyDown}
                    onOpen={() => foundation.handlePanelVisibleChange(true)}
                >
                    <div
                        ref={comboboxRef}
                        className={clsx(`${cssClasses.PREFIX}-input`, {
                            [`${cssClasses.PREFIX}-range-input`]: isRange,
                            [`${cssClasses.PREFIX}-range-input-${size}`]: isRange && size,
                            [`${cssClasses.PREFIX}-range-input-active`]: isRange && rangeInputFocus && !inputDisabled,
                            [`${cssClasses.PREFIX}-range-input-disabled`]: isRange && inputDisabled,
                            [`${cssClasses.PREFIX}-range-input-${validateStatus}`]: isRange && validateStatus,
                            [`${cssClasses.PREFIX}-borderless`]: borderless,
                        })}
                        // aria-required is not supported by the button role
                        aria-describedby={isTriggerButton ? ariaDescribedby : undefined}
                        aria-disabled={isTriggerButton ? disabled : undefined}
                        aria-errormessage={isTriggerButton ? ariaErrormessage : undefined}
                        aria-invalid={isTriggerButton ? ariaInvalid : undefined}
                        aria-label={isTriggerButton && !ariaLabelledby ? valueLabel : undefined}
                        aria-labelledby={isTriggerButton ? ariaLabelledby : undefined}
                        role={isTriggerButton ? 'button' : undefined}
                        // the inputs or a focusable custom trigger are the Tab stop; Tooltip would add 0 here
                        tabIndex={isTriggerButton && !disabled ? 0 : -1}
                        onClick={foundation.handleTriggerClick}
                        // a control inside the trigger (the range clear button, a custom trigger's own) keeps its keys
                        onKeyDown={(e) => {
                            if (!isInnerControlKey(e)) {
                                foundation.handleTriggerKeyDown(e, isTriggerButton && e.target === e.currentTarget);
                            }
                        }}
                    >
                        {typeof triggerRender === 'function' ? <Trigger {...inputProps} value={DatePickerFoundation.getTriggerValue(value, timeZone)} componentProps={componentProps} triggerRender={triggerRender} /> : <DateInput {...inputProps} />}
                    </div>
                </Popover>
            </div>
        </InputGroupContext>
    );
}
