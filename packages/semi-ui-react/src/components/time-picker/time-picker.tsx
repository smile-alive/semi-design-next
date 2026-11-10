import type React from 'react';
import { memo, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import clsx from 'clsx';
import { type ValidateStatus, FocusTrapHandle } from '@fibrae/semi-foundation/base';
import { strings, cssClasses, type PanelType } from '@fibrae/semi-foundation/components/time-picker/constants';
import TimePickerFoundation, { type TimePickerAdapter } from '@fibrae/semi-foundation/components/time-picker/foundation';
import type { Locale } from '@fibrae/semi-foundation/locale';
import { namedRole } from '@fibrae/semi-foundation/utils';
import { getDateFnsLocale } from '@fibrae/semi-foundation/utils/date-fns-locale';
import '@fibrae/semi-foundation/components/time-picker/time-picker.scss';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { useClickOutside } from '../../hooks/index';
import Trigger from '../../internal/trigger';
import { useConfigContext } from '../config-provider/context';
import type { InputSize } from '../input';
import { InputGroupContext, useInputGroupInScope, withInputGroup } from '../input/context';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import type { ScrollItemProps } from '../scroll-list/scroll-item';
import type { Position } from '../tooltip';
import Combobox from './combobox';
import TimeInput from './time-input';

type Foundation = TimePickerFoundation<TimePickerProps, React.FocusEvent<HTMLDivElement>>;
type Adapter = TimePickerAdapter<TimePickerProps, React.FocusEvent<HTMLDivElement>>;

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
        value: (Date | undefined)[],
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
    /** The unpicked side of a range is undefined */
    value: (Date | undefined)[];
    inputValue: string;
    componentProps: Omit<TimePickerProps, 'ref'>;
    onChange: (inputValue: string) => void;
}

/**
 * `onChange` gets arrays when `type` is `timeRange`. Without strictNullChecks an omitted `type` cannot narrow the
 * union, so an inline `onChange` there gets `any` parameters.
 */
export type TimePickerProps = TimePickerCommonProps & ({ type?: 'time'; onChange?: (value: Date, str: string) => void } | { type: 'timeRange'; onChange?: (value: Date[], str: string[]) => void });

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

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    autoAdjustOverflow: true,
    borderless: false,
    showClear: true,
    rangeSeparator: strings.DEFAULT_RANGE_SEPARATOR,
    inputReadOnly: false,
    style: {},
    stopPropagation: true,
    className: '',
    popupClassName: '',
    disabledHours: (): number[] => [],
    disabledMinutes: (): number[] => [],
    disabledSeconds: (): number[] => [],
    hideDisabledOptions: false,
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

    const { locale, localeCode } = useLocale('TimePicker');
    const { timeZone: contextTimeZone, direction, dateFnsLocale: contextDateFnsLocale } = useConfigContext();

    // explicit undefined falls back too: prop, then context, then the global default; the locale is never a prop
    const props = {
        ...withDefaults,
        timeZone: rawProps.timeZone ?? contextTimeZone ?? withDefaults.timeZone,
        placeholder: withDefaults.placeholder ?? locale?.placeholder?.[withDefaults.type],
        locale,
        localeCode,
        dateFnsLocale: getDateFnsLocale(localeCode, contextDateFnsLocale),
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
        // undeclared props (data-*, Form's name, Input props such as prefix) go to the Input, or to the root with a custom trigger
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
    const popupClassName = clsx(TimePickerFoundation.getPanelClassNames({ ...props, prefixCls }), props.popupClassName);

    // class props never carried ref; a triggerRender that spreads componentProps must not grab the handle
    const componentProps = { ...props };

    // only the rendered DOM tells whether a custom trigger has its own focus target.
    // Known limit: re-measured only when triggerRender changes; a stable one that switches between focusable and
    // plain markup needs a MutationObserver
    useEffect(() => {
        if (typeof props.triggerRender === 'function') {
            setCustomTriggerFocusable(FocusTrapHandle.getFocusableElements(rootRef.current).length > 0);
        }
    }, [props.triggerRender]);

    const [foundation, state] = useFoundation<Foundation, Adapter, TimePickerProps, TimePickerState>(
        TimePickerFoundation,
        props,
        () => TimePickerFoundation.getInitialState(props),
        (base) => ({
            notifyOpenChange: (open) => base.getProps().onOpenChange?.(open),
            notifyChange: (value, str) => {
                const current = base.getProps();
                // the foundation passes arrays exactly when type is timeRange; the Array.isArray checks only
                // narrow the arguments to the onChange the type selects
                if (current.type === 'timeRange') {
                    if (Array.isArray(value) && Array.isArray(str)) {
                        current.onChange?.(value, str);
                    }
                } else if (!Array.isArray(value) && !Array.isArray(str)) {
                    current.onChange?.(value, str);
                }
            },
            notifyFocus: (e) => base.getProps().onFocus?.(e),
            notifyBlur: (e) => base.getProps().onBlur?.(e),
            isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panelRef.current),
            // a custom trigger without a focus target of its own leaves the root as the Tab stop
            setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(rootRef.current, { preventScroll: base.getProps().preventScroll }),
            blurFocusedElement: () => {
                const active = FocusTrapHandle.getActiveElement(rootRef.current);
                if (active && (rootRef.current?.contains(active) || panelRef.current?.contains(active))) {
                    active.blur();
                }
            },
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
                    // getOptions, hideDisabledOptions included, works on the resolved functions
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

    useImperativeHandle(props.ref, () => ({ focus: foundation.focus, blur: foundation.blur }), [foundation]);

    delete componentProps.ref;

    const isTriggerButton = useCustomTrigger && !customTriggerFocusable;

    // F2: with no Input to take them, the undeclared props and the attributes kept for the Input land on the root
    const rootProps = (useCustomTrigger ? { ...rest, id, 'aria-describedby': ariaDescribedby, 'aria-errormessage': ariaErrormessage, 'aria-invalid': ariaInvalid, 'aria-labelledby': ariaLabelledby, 'aria-required': ariaRequired } : {}) as React.HTMLAttributes<HTMLDivElement>;

    const outerProps = useCustomTrigger
        ? {
              onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                  rootProps.onClick?.(e);
                  foundation.handlePanelOpen();
              },
          }
        : {};

    const buttonProps = isTriggerButton
        ? {
              role: 'button',
              tabIndex: disabled ? -1 : 0,
              'aria-disabled': disabled,
              'aria-controls': panelId,
              'aria-expanded': open,
              'aria-haspopup': 'dialog' as const,
              onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                  rootProps.onKeyDown?.(e);
                  if (e.target === e.currentTarget) {
                      foundation.handleTriggerKeyDown(e);
                  }
              },
          }
        : {};

    return (
        <InputGroupContext value={undefined}>
            <div
                role={namedRole(rootProps)}
                {...rootProps}
                ref={rootRef}
                className={clsx(prefixCls, className)}
                style={style}
                {...outerProps}
                {...buttonProps}
                onMouseDownCapture={(e) => {
                    rootProps.onMouseDownCapture?.(e);
                    markPressInside(e);
                }}
            >
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
