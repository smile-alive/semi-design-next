import { type JSX, type Ref, For, Show, createEffect, createMemo, createSignal, createUniqueId, mergeProps, on, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import type { Locale as DateFnsLocale } from 'date-fns';
import { isEqual } from 'es-toolkit';
import ComboboxFoundation from '@fibrae/semi-foundation/time-picker/combox-foundation';
import { strings, cssClasses, type PanelType } from '@fibrae/semi-foundation/time-picker/constants';
import TimePickerFoundation, { type TimePickerAdapter } from '@fibrae/semi-foundation/time-picker/foundation';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-foundation/time-picker/time-picker.scss';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import forwardFocus from '../_base/forward-focus';
import mergeRefs from '../_base/merge-refs';
import { usePopupLayer } from '../_base/popup-layer';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import useConfig from '../config-provider/use-config';
import type { InputSize, ValidateStatus } from '../input';
import { InputGroupContext, useInputGroupContext } from '../input/context';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import type { ScrollItemProps } from '../scroll-list';
import type { Position } from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';
import Combobox from './combobox';
import TimeInput from './time-input';

export type BaseValueType = string | number | Date | undefined;

export type Type = 'time' | 'timeRange';

/** Undeclared props (data-*, aria-*, id, name, autofocus, Input props) go to the native input */
interface TimePickerCommonProps extends ElementProps<'input', 'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'onFocus' | 'prefix' | 'placeholder' | 'ref'> {
    autoAdjustOverflow?: boolean;
    borderless?: boolean;
    /** On the root element */
    class?: string;
    clearIcon?: JSX.Element;
    defaultOpen?: boolean;
    defaultValue?: BaseValueType | BaseValueType[];
    disabled?: boolean;
    disabledHours?: () => number[];
    disabledMinutes?: (selectedHour: number) => number[];
    disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
    /**
     * Range-only callback to derive disabled hours/minutes/seconds for the left and right panel separately. In single
     * mode this prop is ignored (the top-level disabledHours / disabledMinutes / disabledSeconds props are used instead).
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
    inputReadOnly?: boolean;
    inputStyle?: JSX.CSSProperties | string;
    insetLabel?: JSX.Element;
    insetLabelId?: string;
    /** Input takes the length limits as numbers only */
    maxLength?: number;
    minLength?: number;
    minuteStep?: number;
    motion?: boolean;
    open?: boolean;
    panelFooter?: JSX.Element;
    panelHeader?: JSX.Element;
    /** Range mode only: item `i` is shown as both the header and the footer of panel `i`, over panelHeader and panelFooter */
    panels?: JSX.Element[];
    placeholder?: string;
    popupClassName?: string;
    popupStyle?: JSX.CSSProperties | string;
    position?: Position;
    prefix?: JSX.Element;
    prefixCls?: string;
    preventScroll?: boolean;
    rangeSeparator?: string;
    scrollItemProps?: Pick<ScrollItemProps, 'cycled' | 'mode' | 'motion' | 'transform'>;
    secondStep?: number;
    showClear?: boolean;
    size?: InputSize;
    stopPropagation?: boolean;
    /** On the root element */
    style?: JSX.CSSProperties | string;
    timeZone?: string | number;
    /** Called once; the props it gets are live, so read them in the returned JSX */
    triggerRender?: (props: TimePickerTriggerRenderProps) => JSX.Element;
    type?: Type;
    use12Hours?: boolean;
    validateStatus?: ValidateStatus;
    /** `null` is a controlled empty value; only `undefined` leaves the picker uncontrolled */
    value?: BaseValueType | BaseValueType[] | null;
    /** Called only when a mousedown outside closes the panel */
    onBlur?: (e: MouseEvent) => void;
    onFocus?: (e: FocusEvent) => void;
    onOpenChange?: (open: boolean) => void;
    /** The root element; its `focus()` and `blur()` act on the input */
    ref?: Ref<HTMLDivElement>;
}

/** What `triggerRender` gets, every key live; `componentProps` are the props of the TimePicker, without `ref` */
export interface TimePickerTriggerRenderProps {
    disabled: boolean;
    placeholder: string;
    value: Date[];
    inputValue: string;
    componentProps: Omit<TimePickerProps, 'ref'>;
    onChange: (inputValue: string) => void;
}

/** `onChange` gets arrays when `type` is `timeRange` */
export type TimePickerProps = TimePickerCommonProps & ({ type?: 'time'; onChange?: (value: Date, str: string) => void } | { type: 'timeRange'; onChange?: (value: Date[], str: string[]) => void });

export interface TimePickerState {
    open: boolean;
    value: Date[];
    inputValue: string;
    invalid: boolean;
}

type FoundationProps = TimePickerProps & { dateFnsLocale: DateFnsLocale };
type Foundation = TimePickerFoundation<FoundationProps, FocusEvent>;
type Adapter = TimePickerAdapter<FoundationProps, FocusEvent>;

const defaultProps = {
    autoAdjustOverflow: true,
    borderless: false,
    showClear: true,
    rangeSeparator: strings.DEFAULT_RANGE_SEPARATOR,
    prefixCls: cssClasses.PREFIX,
    inputReadOnly: false,
    stopPropagation: true,
    hideDisabledOptions: false,
    use12Hours: false,
    focusOnOpen: false,
    size: 'default',
    type: strings.DEFAULT_TYPE as Type,
    motion: true,
} satisfies Partial<TimePickerProps>;

const rangeSlot = (slot: JSX.Element, index: number) => (Array.isArray(slot) ? slot[index] : slot);

export default function TimePicker(rawProps: TimePickerProps) {
    const defaulted = useDefaultProps('TimePicker', rawProps, defaultProps);

    const config = useConfig();
    const group = useInputGroupContext();
    const layer = usePopupLayer();
    const locale = useLocale('TimePicker');

    let root: HTMLDivElement | undefined;
    const [panel, setPanel] = createSignal<HTMLDivElement>();
    const panelId = createUniqueId();

    // only the rendered DOM tells whether a custom trigger has its own focus target
    const [customTrigger, setCustomTrigger] = createSignal<HTMLDivElement>();
    const [customTriggerFocusable, setCustomTriggerFocusable] = createSignal(false);

    const inGroup = group?.layer === layer ? group : undefined;

    // explicit undefined falls back too: prop, then ConfigProvider, then the global default; the locale is never a prop.
    // As Input: own value, then the group's, then the global default.
    const props = mergeProps(defaulted, {
        get size() {
            return rawProps.size ?? inGroup?.view().size ?? defaulted.size;
        },
        get disabled() {
            return rawProps.disabled ?? inGroup?.view().disabled ?? defaulted.disabled;
        },
        get timeZone() {
            return rawProps.timeZone ?? config().timeZone ?? defaulted.timeZone;
        },
        get placeholder() {
            return defaulted.placeholder ?? locale().locale.placeholder[defaulted.type];
        },
        get dateFnsLocale() {
            return locale().dateFnsLocale;
        },
    }) as FoundationProps & typeof defaultProps & { placeholder: string };

    // validateStatus, insetLabel and insetLabelId are read from props: the Form-injected keys never reach the split
    const [local, rest] = splitProps(omitFormInjected(props), [
        'autoAdjustOverflow',
        'borderless',
        'class',
        'clearIcon',
        'dateFnsLocale',
        'defaultOpen',
        'defaultValue',
        'disabled',
        'disabledHours',
        'disabledMinutes',
        'disabledSeconds',
        'disabledTime',
        'focusOnOpen',
        'format',
        'hideDisabledOptions',
        'hourStep',
        'inputReadOnly',
        'inputStyle',
        'minuteStep',
        'motion',
        'onBlur',
        'onChange',
        'onFocus',
        'onOpenChange',
        'open',
        'panelFooter',
        'panelHeader',
        'panels',
        'placeholder',
        'popupClassName',
        'popupStyle',
        'position',
        'prefix',
        'prefixCls',
        'preventScroll',
        'rangeSeparator',
        'ref',
        'scrollItemProps',
        'secondStep',
        'showClear',
        'size',
        'stopPropagation',
        'style',
        'timeZone',
        'triggerRender',
        'type',
        'use12Hours',
        'value',
    ]);

    // a triggerRender that spreads componentProps must not grab the root element
    const [, componentProps] = splitProps(props, ['ref']);

    const registerSpecialTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, TimePickerState>(
        TimePickerFoundation,
        props,
        (view) => ({ open: Boolean((view.open || view.defaultOpen) && !view.disabled), ...TimePickerFoundation.getInitialState(view) }),
        (base) => ({
            setPanelOpen: (open) => base.setState({ open }),
            setInputValue: (inputValue) => base.setState({ inputValue }),
            notifyOpenChange: (open) => props.onOpenChange?.(open),
            // the foundation passes arrays exactly when type is timeRange, which is what the onChange union says
            notifyChange: (value, str) => (props.onChange as ((value: Date | Date[], str: string | string[]) => void) | undefined)?.(value, str),
            notifyFocus: (e) => props.onFocus?.(e),
            notifyBlur: (e) => props.onBlur?.(e),
            isRangePicker: () => props.type === strings.TYPE_TIME_RANGE_PICKER,
            isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panel()),
            // the input, or the focus target of a custom trigger, which is its wrapper when it has none of its own
            setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(root, { preventScroll: props.preventScroll }),
        })
    );

    const open = () => TimePickerFoundation.isPanelShown(props, state());

    const markPressInside = useClickOutside([() => root, panel], foundation.handleClickOutside, open);

    const triggerRenderProps: TimePickerTriggerRenderProps = {
        get disabled() {
            return Boolean(local.disabled);
        },
        get placeholder() {
            return local.placeholder;
        },
        get value() {
            return state().value;
        },
        get inputValue() {
            return state().inputValue;
        },
        componentProps: componentProps as Omit<TimePickerProps, 'ref'>,
        onChange: foundation.handleInputChange,
    };

    const isRange = () => local.type === strings.TYPE_TIME_RANGE_PICKER;

    const format = () => TimePickerFoundation.getValidFormat(props);

    // a new value prop wins (back to undefined clears it), else a new timeZone re-zones the shown value, else only the
    // text is re-formatted. By value: a Date or array rebuilt by the owner is a new object and must not reset typed text
    const syncInputs = createMemo(() => ({ value: local.value, timeZone: local.timeZone, format: format(), dateFnsLocale: local.dateFnsLocale, rangeSeparator: local.rangeSeparator }), undefined, {
        equals: (a, b) => isEqual(a.value, b.value) && a.timeZone === b.timeZone && a.format === b.format && a.dateFnsLocale === b.dateFnsLocale && a.rangeSeparator === b.rangeSeparator,
    });

    const position = () => TimePickerFoundation.getPosition(props, config().direction);

    const popupClassName = () => {
        const { showHour, showMinute, showSecond } = ComboboxFoundation.getColumns(format());
        const columnCount = [showHour, showMinute, showSecond, local.use12Hours].filter(Boolean).length;
        return clsx(
            `${local.prefixCls}-panel`,
            local.popupClassName,
            {
                [`${local.prefixCls}-panel-narrow`]: (!showHour || !showMinute || !showSecond) && !local.use12Hours,
                [cssClasses.RANGE_PICKER]: isRange(),
            },
            `${local.prefixCls}-panel-column-${columnCount}`
        );
    };

    // a custom trigger without a focus target of its own is a button that opens the panel
    const isTriggerButton = () => !customTriggerFocusable();

    const customTriggerOwn = {
        ref: setCustomTrigger,
        get role() {
            return isTriggerButton() ? 'button' : undefined;
        },
        get tabIndex() {
            return isTriggerButton() ? (local.disabled ? -1 : 0) : null;
        },
        get 'aria-disabled'() {
            return isTriggerButton() ? Boolean(local.disabled) : undefined;
        },
        get 'aria-controls'() {
            return isTriggerButton() ? panelId : null;
        },
        get 'aria-expanded'() {
            return isTriggerButton() ? open() : null;
        },
        get 'aria-haspopup'() {
            return isTriggerButton() ? ('dialog' as const) : null;
        },
        onClick: foundation.handlePanelOpen,
        onKeyDown: (e: KeyboardEvent) => {
            if (isTriggerButton() && e.target === e.currentTarget) {
                foundation.handleTriggerKeyDown(e);
            }
        },
    };

    // reads the slot getters once each: every read creates the nodes again
    const headerOf = (index: number) => (isRange() ? (local.panels?.[index] ?? rangeSlot(local.panelHeader ?? [locale().locale.begin, locale().locale.end], index)) : local.panelHeader);

    const footerOf = (index: number) => (isRange() ? (local.panels?.[index] ?? rangeSlot(local.panelFooter, index)) : local.panelFooter);

    const focusOptions = () => ({ preventScroll: props.preventScroll });

    const setRoot = (node: HTMLDivElement) => {
        root = node;
        forwardFocus(node, () => node.querySelector('input'), focusOptions);
        registerSpecialTrigger(node);
    };

    const renderPanel = () => (
        // the delegated handler sees a press in a popup portaled from the panel before the popup stops it
        <div ref={setPanel} id={panelId} class={clsx({ [cssClasses.RANGE_PANEL_LISTS]: isRange() })} onMouseDown={markPressInside}>
            <For each={isRange() ? [0, 1] : [0]}>
                {(index) => {
                    // ComboboxFoundation, hideDisabledOptions included, works on the resolved functions
                    const disabledFns = createMemo(() => TimePickerFoundation.getDisabledTimeFns(props, state().value, index === 1 ? 'right' : 'left', isRange()));
                    return (
                        <Combobox
                            // an empty range starts its end panel in the afternoon
                            defaultIsAM={index === 0}
                            disabledHours={disabledFns().disabledHours}
                            disabledMinutes={disabledFns().disabledMinutes}
                            disabledSeconds={disabledFns().disabledSeconds}
                            format={format()}
                            hideDisabledOptions={local.hideDisabledOptions}
                            hourStep={local.hourStep}
                            minuteStep={local.minuteStep}
                            panelFooter={footerOf(index)}
                            panelHeader={headerOf(index)}
                            prefixCls={`${local.prefixCls}-panel`}
                            scrollItemProps={local.scrollItemProps}
                            secondStep={local.secondStep}
                            timeStampValue={state().value[index]}
                            use12Hours={local.use12Hours}
                            onChange={(value) => foundation.handlePanelChange(value, index)}
                        />
                    );
                }}
            </For>
        </div>
    );

    const renderInput = () => (
        <TimeInput
            {...rest}
            // APG combobox: the input opens the panel of lists and carries its state
            role="combobox"
            style={local.inputStyle}
            aria-controls={panelId}
            aria-expanded={open()}
            aria-haspopup="dialog"
            borderless={local.borderless}
            clearIcon={local.clearIcon}
            disabled={local.disabled}
            focusOnOpen={local.focusOnOpen}
            inputReadOnly={local.inputReadOnly}
            insetLabel={props.insetLabel}
            insetLabelId={props.insetLabelId}
            invalid={state().invalid}
            placeholder={local.placeholder || locale().locale.placeholder[local.type]}
            prefix={local.prefix}
            prefixCls={local.prefixCls}
            preventScroll={local.preventScroll}
            showClear={local.disabled ? false : local.showClear}
            size={local.size}
            validateStatus={props.validateStatus}
            value={state().inputValue}
            onBlur={foundation.handleInputBlur}
            onChange={foundation.handleInputChange}
            onFocus={foundation.handleFocus}
        />
    );

    useWatch(syncInputs, (current, previous) => {
        if (!isEqual(current.value, previous.value)) {
            foundation.syncValueFromProps({ value: current.value ?? [], timeZone: current.timeZone });
        } else if (current.timeZone !== previous.timeZone) {
            foundation.syncValueFromProps({ value: foundation.getState('value'), timeZone: current.timeZone, prevTimeZone: previous.timeZone });
        } else {
            // only the text changes: syncing the value again would re-zone it a second time
            foundation.refreshInputValue();
        }
    });

    // isPanelShown is already false for a disabled picker, so the check leaves `disabled` out
    useWatch(
        () => Boolean(local.disabled),
        (disabled) => {
            if (disabled && TimePickerFoundation.isPanelShown({ open: local.open }, foundation.getStates())) {
                foundation.close();
            }
        }
    );

    // Known limit: measured when the custom trigger mounts, which a new triggerRender does; a stable one that switches
    // between focusable and plain markup needs a MutationObserver
    createEffect(
        on(customTrigger, (element) => {
            if (element) {
                setCustomTriggerFocusable(FocusTrapHandle.getFocusableElements(element).length > 0);
            }
        })
    );

    return (
        // the inputs and any prefix or trigger content belong to the TimePicker, not to an enclosing InputGroup
        <InputGroupContext.Provider value={undefined}>
            <div ref={untrack(() => mergeRefs(setRoot, local.ref))} class={clsx(local.prefixCls, local.class)} style={local.style} onMouseDown={markPressInside}>
                <Popover
                    contentClassName={popupClassName()}
                    style={local.popupStyle}
                    aria-label={locale().locale.panel[local.type]}
                    autoAdjustOverflow={local.autoAdjustOverflow}
                    content={renderPanel}
                    motion={local.motion}
                    position={position()}
                    stopPropagation={local.stopPropagation}
                    trigger="custom"
                    visible={open()}
                    // the trigger is custom, so the Popover leaves closing on Esc to the TimePicker
                    onEscKeyDown={foundation.handleEscKeyDown}
                >
                    {(getTriggerProps) => (
                        <Show
                            when={local.triggerRender}
                            keyed
                            fallback={
                                // the input is the Tab stop; Tooltip would add 0 here
                                <span {...getTriggerProps({ class: `${local.prefixCls}-header`, tabIndex: -1 })}>{renderInput()}</span>
                            }
                        >
                            {(render) => <div {...(getTriggerProps(customTriggerOwn) as JSX.HTMLAttributes<HTMLDivElement>)}>{render(triggerRenderProps)}</div>}
                        </Show>
                    )}
                </Popover>
            </div>
        </InputGroupContext.Provider>
    );
}
