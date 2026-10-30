import type React from 'react';
import { memo, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import ComboboxFoundation from '@fibrae/semi-foundation/time-picker/combox-foundation';
import { strings, cssClasses, type PanelType } from '@fibrae/semi-foundation/time-picker/constants';
import TimePickerFoundation, { type TimePickerAdapter } from '@fibrae/semi-foundation/time-picker/foundation';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/time-picker/time-picker.scss';
import type { ElementProps } from '../_base/base';
import type { ValidateStatus } from '../_base/base-component';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { useConfigContext } from '../config-provider/context';
import type { InputSize } from '../input';
import { InputGroupContext, useInputGroupInScope, withInputGroup } from '../input/context';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import type { ScrollItemProps } from '../scroll-list/scroll-item';
import type { Position } from '../tooltip';
import Trigger from '../trigger';
import Combobox from './combobox';
import TimeInput from './time-input';

export type BaseValueType = string | number | Date | undefined;

export type Type = 'time' | 'timeRange';

interface TimePickerCommonProps extends ElementProps<'input', 'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'onFocus'> {
    autoAdjustOverflow?: boolean;
    autoFocus?: boolean;
    borderless?: boolean;
    className?: string;
    clearIcon?: React.ReactNode;
    defaultOpen?: boolean;
    defaultValue?: BaseValueType | BaseValueType[];
    disabled?: boolean;
    disabledHours?: () => number[];
    disabledMinutes?: (selectedHour: number) => number[];
    disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
    /**
     * Range-only callback to derive disabled hours/minutes/seconds for the
     * left and right panel separately. In single mode this prop is ignored
     * (the top-level disabledHours / disabledMinutes / disabledSeconds props
     * are used instead).
     */
    disabledTime?: (
        value: Date[],
        panelType: PanelType
    ) => {
        disabledHours?: () => number[];
        disabledMinutes?: (selectedHour: number) => number[];
        disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
    };
    focusOnOpen?: boolean;
    format?: string;
    hideDisabledOptions?: boolean;
    hourStep?: number;
    id?: string;
    inputReadOnly?: boolean;
    inputStyle?: React.CSSProperties;
    insetLabel?: React.ReactNode;
    insetLabelId?: string;
    minuteStep?: number;
    motion?: boolean;
    open?: boolean;
    panelFooter?: React.ReactNode | React.ReactNode[];
    panelHeader?: React.ReactNode | React.ReactNode[];
    /** Range mode only: item `i` is shown as both the header and the footer of panel `i`, over panelHeader and panelFooter */
    panels?: React.ReactNode[];
    placeholder?: string;
    popupClassName?: string;
    popupStyle?: React.CSSProperties;
    position?: Position;
    prefixCls?: string;
    preventScroll?: boolean;
    rangeSeparator?: string;
    scrollItemProps?: Pick<ScrollItemProps<any>, 'cycled' | 'mode' | 'motion' | 'transform'>;
    secondStep?: number;
    showClear?: boolean;
    size?: InputSize;
    stopPropagation?: boolean;
    style?: React.CSSProperties;
    timeZone?: string | number;
    triggerRender?: (props: TimePickerTriggerRenderProps) => React.ReactNode;
    type?: Type;
    use12Hours?: boolean;
    validateStatus?: ValidateStatus;
    /** `null` is a controlled empty value; only `undefined` leaves the picker uncontrolled */
    value?: BaseValueType | BaseValueType[] | null;
    /** Called only when a mousedown outside closes the panel */
    onBlur?: (e: MouseEvent) => void;
    onFocus?: React.FocusEventHandler<HTMLDivElement>;
    onOpenChange?: (open: boolean) => void;
}

/** What `triggerRender` gets; `componentProps` are the props of the TimePicker, without `ref` */
export interface TimePickerTriggerRenderProps {
    disabled: boolean;
    placeholder: string;
    value: Date[];
    inputValue: string;
    componentProps: Omit<TimePickerProps, 'ref'>;
    onChange: (inputValue: string) => void;
}

/**
 * `onChange` gets arrays when `type` is `timeRange`. Without strictNullChecks an omitted `type` cannot narrow the
 * union, so an inline `onChange` there gets `any` parameters.
 */
export type TimePickerProps = TimePickerCommonProps & ({ type?: 'time'; onChange?: (value: Date, str: string) => void } | { type: 'timeRange'; onChange?: (value: Date[], str: string[]) => void });

/** The methods on a TimePicker ref */
export interface TimePickerHandle {
    /** Focuses the input, which opens the panel; `preventScroll` applies */
    focus: () => void;
    blur: () => void;
}

export interface TimePickerState {
    open: boolean;
    value: Date[];
    inputValue: string;
    invalid: boolean;
}

const defaultProps = {
    autoAdjustOverflow: true,
    borderless: false,
    showClear: true,
    rangeSeparator: strings.DEFAULT_RANGE_SEPARATOR,
    onOpenChange: noop,
    prefixCls: cssClasses.PREFIX,
    inputReadOnly: false,
    style: {},
    stopPropagation: true,
    className: '',
    popupClassName: '',
    disabledHours: (): number[] => [],
    disabledMinutes: (): number[] => [],
    disabledSeconds: (): number[] => [],
    hideDisabledOptions: false,
    onFocus: noop,
    onBlur: noop,
    onChange: noop,
    use12Hours: false,
    focusOnOpen: false,
    size: 'default',
    type: strings.DEFAULT_TYPE,
    motion: true,
} satisfies Partial<TimePickerProps>;

function getPanelSlots({ panels, panelFooter, panelHeader, locale, type }: TimePickerProps & { locale: Locale['TimePicker'] }, index: number) {
    if (type !== strings.TYPE_TIME_RANGE_PICKER) {
        return { panelHeader, panelFooter };
    }
    const defaultHeaderMap = [locale.begin, locale.end];
    return {
        panelHeader: (panels?.[index] ?? (panelHeader == null ? (defaultHeaderMap[index] ?? null) : Array.isArray(panelHeader) ? panelHeader[index] : panelHeader)) as React.ReactNode,
        panelFooter: panels?.[index] ?? (Array.isArray(panelFooter) ? panelFooter[index] : panelFooter),
    };
}

function TimePicker(rawProps: TimePickerProps & { ref?: React.Ref<TimePickerHandle> }) {
    const withDefaults = useDefaultProps('TimePicker', withInputGroup(rawProps, useInputGroupInScope()), defaultProps);

    const { locale, localeCode, dateFnsLocale } = useLocale('TimePicker');
    const { timeZone: contextTimeZone, direction } = useConfigContext();

    // explicit undefined falls back too: prop, then context, then the global default; the locale is never a prop
    const props = {
        ...withDefaults,
        timeZone: rawProps.timeZone ?? contextTimeZone ?? withDefaults.timeZone,
        placeholder: withDefaults.placeholder ?? locale?.placeholder?.[withDefaults.type],
        locale,
        localeCode,
        dateFnsLocale,
    };

    const {
        ref,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        autoAdjustOverflow,
        autoFocus,
        borderless,
        className,
        clearIcon,
        dateFnsLocale: _dateFnsLocale,
        defaultOpen,
        defaultValue,
        disabled,
        disabledHours,
        disabledMinutes,
        disabledSeconds,
        disabledTime,
        focusOnOpen,
        format: _format,
        hideDisabledOptions,
        hourStep,
        id,
        inputReadOnly,
        inputStyle,
        insetLabel,
        insetLabelId,
        locale: _locale,
        localeCode: _localeCode,
        minuteStep,
        motion,
        open: _open,
        panelFooter,
        panelHeader,
        panels,
        placeholder,
        popupClassName: _popupClassName,
        popupStyle,
        position: _position,
        prefixCls,
        preventScroll,
        rangeSeparator,
        scrollItemProps,
        secondStep,
        showClear,
        size,
        stopPropagation,
        style,
        timeZone,
        triggerRender,
        type,
        use12Hours,
        validateStatus,
        value: _value,
        onBlur,
        onChange,
        onFocus,
        onOpenChange,
        // undeclared props (data-*, Form's name, Input props such as prefix) go to the Input
        ...rest
    } = props;

    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelId = useId();
    const [customTriggerFocusable, setCustomTriggerFocusable] = useState(false);

    const format = TimePickerFoundation.getValidFormat(props);
    const position = TimePickerFoundation.getPosition(props, direction);
    const isRange = type === strings.TYPE_TIME_RANGE_PICKER;
    const useCustomTrigger = typeof triggerRender === 'function';
    const { showHour, showMinute, showSecond } = ComboboxFoundation.getColumns(format);
    const selectColumnCount = [showHour, showMinute, showSecond, use12Hours].filter(Boolean).length;

    const popupClassName = clsx(
        `${prefixCls}-panel`,
        props.popupClassName,
        {
            [`${prefixCls}-panel-narrow`]: (!showHour || !showMinute || !showSecond) && !use12Hours,
            [cssClasses.RANGE_PICKER]: isRange,
        },
        `${prefixCls}-panel-column-${selectColumnCount}`
    );

    // class props never carried ref; a triggerRender that spreads componentProps must not grab the handle
    const componentProps = { ...props };

    // only the rendered DOM tells whether a custom trigger has its own focus target.
    // Known limit: re-measured only when triggerRender changes; a stable one that switches between focusable and
    // plain markup needs a MutationObserver
    useLayoutEffect(() => {
        if (typeof props.triggerRender === 'function') {
            setCustomTriggerFocusable(FocusTrapHandle.getFocusableElements(rootRef.current).length > 0);
        }
    }, [props.triggerRender]);

    const [foundation, state] = useFoundation<TimePickerFoundation<TimePickerProps, React.FocusEvent<HTMLDivElement>>, TimePickerAdapter<TimePickerProps, React.FocusEvent<HTMLDivElement>>, TimePickerProps, TimePickerState>(
        TimePickerFoundation,
        props,
        () => ({ open: Boolean((props.open || props.defaultOpen) && !props.disabled), ...TimePickerFoundation.getInitialState(props) }),
        (base) => ({
            setPanelOpen: (open) => base.setState({ open }),
            setInputValue: (inputValue) => base.setState({ inputValue }),
            notifyOpenChange: (open) => base.getProps().onOpenChange(open),
            notifyChange: (value, str) => {
                const current = base.getProps();
                // the foundation passes arrays exactly when type is timeRange; the Array.isArray checks only
                // narrow the arguments to the onChange the type selects
                if (current.type === 'timeRange') {
                    if (Array.isArray(value) && Array.isArray(str)) {
                        current.onChange(value, str);
                    }
                } else if (!Array.isArray(value) && !Array.isArray(str)) {
                    current.onChange(value, str);
                }
            },
            notifyFocus: (e) => base.getProps().onFocus(e),
            notifyBlur: (e) => base.getProps().onBlur(e),
            isRangePicker: () => base.getProps().type === strings.TYPE_TIME_RANGE_PICKER,
            isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panelRef.current),
            // a custom trigger without a focus target of its own leaves the root as the Tab stop
            setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(rootRef.current, { preventScroll: base.getProps().preventScroll }),
        })
    );

    const open = TimePickerFoundation.isPanelShown(props, state);

    const markPressInside = useClickOutside([rootRef, panelRef], foundation.handleClickOutside, open);

    const panelContent = (
        <div ref={panelRef} id={panelId} className={clsx({ [cssClasses.RANGE_PANEL_LISTS]: isRange })}>
            {(isRange ? [0, 1] : [0]).map((index) => (
                <Combobox
                    key={index}
                    // an empty range starts its end panel in the afternoon
                    defaultIsAM={index === 0}
                    // ComboboxFoundation, hideDisabledOptions included, works on the resolved functions
                    {...TimePickerFoundation.getDisabledTimeFns(props, state.value, index === 1 ? 'right' : 'left', isRange)}
                    format={format}
                    hideDisabledOptions={hideDisabledOptions}
                    hourStep={hourStep}
                    minuteStep={minuteStep}
                    prefixCls={`${prefixCls}-panel`}
                    scrollItemProps={scrollItemProps}
                    secondStep={secondStep}
                    timeStampValue={state.value[index]}
                    use12Hours={use12Hours}
                    onChange={(v) => foundation.handlePanelChange(v, index)}
                    {...getPanelSlots(props, index)}
                />
            ))}
        </div>
    );

    // a new value prop wins (back to undefined clears it), else a new timeZone re-zones the shown value
    useDidUpdate(props, (current, prev) => {
        // by value: a Date or array built in the parent's render is a new object every time and must not reset typed text
        if (!isEqual(current.value, prev.value)) {
            foundation.syncValueFromProps({ value: current.value, timeZone: current.timeZone });
        } else if (current.timeZone !== prev.timeZone) {
            foundation.syncValueFromProps({
                value: foundation.getState('value'),
                timeZone: current.timeZone,
                prevTimeZone: prev.timeZone,
            });
        } else if (TimePickerFoundation.getValidFormat(current) !== TimePickerFoundation.getValidFormat(prev) || current.dateFnsLocale !== prev.dateFnsLocale || current.rangeSeparator !== prev.rangeSeparator) {
            // only the text changes: syncing the value again would re-zone it a second time
            foundation.refreshInputValue();
        }
        if (current.disabled && !prev.disabled && TimePickerFoundation.isPanelShown({ ...current, disabled: false }, foundation.getStates())) {
            foundation.close();
        }
    });

    useImperativeHandle(
        props.ref,
        () => ({
            focus: () => rootRef.current?.querySelector('input')?.focus({ preventScroll: foundation.getProp('preventScroll') }),
            blur: () => rootRef.current?.querySelector('input')?.blur(),
        }),
        [foundation]
    );

    delete componentProps.ref;

    const isTriggerButton = useCustomTrigger && !customTriggerFocusable;
    const outerProps = useCustomTrigger ? { onClick: foundation.handlePanelOpen } : {};

    const buttonProps = isTriggerButton
        ? {
              role: 'button',
              tabIndex: disabled ? -1 : 0,
              'aria-disabled': disabled,
              'aria-controls': panelId,
              'aria-expanded': open,
              'aria-haspopup': 'dialog' as const,
              onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.target === e.currentTarget) {
                      foundation.handleTriggerKeyDown(e);
                  }
              },
          }
        : {};

    return (
        <InputGroupContext value={undefined}>
            <div ref={rootRef} className={clsx(prefixCls, className)} style={style} {...outerProps} {...buttonProps} onMouseDownCapture={markPressInside}>
                <Popover
                    contentClassName={popupClassName}
                    style={popupStyle}
                    aria-label={locale.panel[type]}
                    autoAdjustOverflow={autoAdjustOverflow}
                    content={panelContent}
                    motion={motion}
                    position={position}
                    stopPropagation={stopPropagation}
                    trigger="custom"
                    visible={open}
                    // the trigger is custom, so the Popover leaves closing on Esc to the TimePicker
                    onEscKeyDown={foundation.handleEscKeyDown}
                >
                    {useCustomTrigger ? (
                        <Trigger disabled={disabled} placeholder={placeholder} value={state.value} componentProps={componentProps} inputValue={state.inputValue} triggerRender={triggerRender} onChange={(v: string) => foundation.handleInputChange(v)} />
                    ) : (
                        // the input is the Tab stop; Tooltip would add 0 here
                        <span className={`${prefixCls}-header`} tabIndex={-1}>
                            <TimeInput
                                {...rest}
                                id={id}
                                type={type}
                                style={inputStyle}
                                aria-controls={panelId}
                                aria-describedby={ariaDescribedby}
                                aria-errormessage={ariaErrormessage}
                                aria-expanded={open}
                                aria-haspopup="dialog"
                                aria-invalid={ariaInvalid}
                                aria-labelledby={ariaLabelledby}
                                aria-required={ariaRequired}
                                autoFocus={autoFocus}
                                // APG combobox: the input opens the panel of lists and carries its state
                                role="combobox"
                                disabled={disabled}
                                placeholder={placeholder}
                                value={state.inputValue}
                                borderless={borderless}
                                clearIcon={clearIcon}
                                focusOnOpen={focusOnOpen}
                                inputReadOnly={inputReadOnly}
                                insetLabel={insetLabel}
                                insetLabelId={insetLabelId}
                                invalid={state.invalid}
                                locale={locale}
                                prefixCls={prefixCls}
                                preventScroll={preventScroll}
                                showClear={disabled ? false : showClear}
                                size={size}
                                validateStatus={validateStatus}
                                onBlur={foundation.handleInputBlur}
                                onChange={foundation.handleInputChange}
                                onFocus={foundation.handleFocus}
                            />
                        </span>
                    )}
                </Popover>
            </div>
        </InputGroupContext>
    );
}

export default memo(TimePicker);
