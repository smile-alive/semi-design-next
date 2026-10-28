import { type JSX, type Ref, Show, children, createEffect, createMemo, createSignal, createUniqueId, mergeProps, on, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import getYearMonthFromValue from '@fibrae/semi-foundation/date-picker/_utils/get-year-month-from-value';
import { isRangeType, isRangeValueComplete, isYearOrMonthType, needConfirm } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/date-picker/constants';
import DatePickerFoundation, { type DatePickerAdapter, type DatePickerFoundationProps, type DatePickerFoundationState, type DayStatusType, type DisabledDateOptions, type PresetType, type RangeInput, type Type } from '@fibrae/semi-foundation/date-picker/foundation';
import { isInnerControlKey } from '@fibrae/semi-foundation/utils/a11y';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-foundation/date-picker/date-picker.scss';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import { namedRole } from '../_base/named-role';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import type { Position } from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';
import DateInput, { type DateInputProps } from './date-input';
import Footer from './footer';
import MonthsGrid, { type DatePickerTimePickerOpts, type MonthsGridHandle } from './months-grid';
import QuickControl from './quick-control';
import YearAndMonth, { type YearAndMonthOpts } from './year-and-month';

// the foundation types these as `any` or with React-free shapes; DatePickerProps declares the Solid ones
type RedeclaredKeys =
    | 'dateFnsLocale'
    | 'className'
    | 'style'
    | 'autoFocus'
    | 'inputStyle'
    | 'dropdownStyle'
    | 'bottomSlot'
    | 'insetLabel'
    | 'prefix'
    | 'topSlot'
    | 'renderDate'
    | 'renderFullDate'
    | 'triggerRender'
    | 'rangeSeparatorNode'
    | 'timePickerOpts'
    | 'position'
    | 'onBlur'
    | 'onClear'
    | 'onFocus'
    | 'onPresetClick'
    | 'onClickOutSide';

/** Undeclared props (data-*, aria-label, id, title) go to the root element */
export interface DatePickerProps extends Omit<DatePickerFoundationProps, RedeclaredKeys>, ElementProps<'div', 'prefix' | 'style' | 'defaultValue' | 'onChange' | 'onBlur' | 'onFocus' | 'onCancel' | 'placeholder' | 'autofocus' | 'ref'> {
    /** Focuses the input once mounted */
    autofocus?: boolean;
    bottomSlot?: JSX.Element;
    /** On the root element */
    class?: string;
    clearIcon?: JSX.Element;
    dropdownStyle?: JSX.CSSProperties | string;
    inputStyle?: JSX.CSSProperties | string;
    insetLabel?: JSX.Element;
    insetLabelId?: string;
    leftSlot?: JSX.Element;
    position?: Position;
    prefix?: JSX.Element;
    /**
     * Only renders the separator between range inputs; parsing and formatting still use `rangeSeparator`.
     */
    rangeSeparatorNode?: JSX.Element;
    renderDate?: (dayNumber?: number, fullDate?: string) => JSX.Element;
    renderFullDate?: (dayNumber?: number, fullDate?: string, dayStatus?: DayStatusType) => JSX.Element;
    rightSlot?: JSX.Element;
    /** On the root element */
    style?: JSX.CSSProperties | string;
    timePickerOpts?: DatePickerTimePickerOpts;
    topSlot?: JSX.Element;
    /** Called once; the props it gets are live, so read them in the returned JSX */
    triggerRender?: (props: TriggerRenderProps) => JSX.Element;
    yearAndMonthOpts?: YearAndMonthOpts;
    /**
     * Called when the panel closes; `e` is the outside mousedown that closed it, absent for other ways of closing.
     * A range has several inputs that blur repeatedly: prefer `onOpenChange` or `onClickOutSide`.
     */
    onBlur?: (e?: MouseEvent) => void;
    onClear?: (e: MouseEvent) => void;
    /**
     * `e` is an input focus, or the click or key press on the trigger that focused the range start; `rangeType` is
     * set for range inputs only. A range has several inputs that focus repeatedly: prefer `onOpenChange` or
     * `triggerRender`.
     */
    onFocus?: (e: FocusEvent | MouseEvent | KeyboardEvent, rangeType?: RangeInput | false) => void;
    onPresetClick?: (item: PresetType, e: MouseEvent) => void;
    onClickOutSide?: (e: MouseEvent) => void;
    /** Gets arrays in range and multiple mode */
    onChange?: (date: Date | Date[], dateString: string | string[]) => void;
    /** The root element, which carries the DatePickerHandle methods */
    ref?: Ref<DatePickerElement>;
}

/** React's DatePickerHandle methods; the root element passed to `ref` carries them */
export interface DatePickerHandle {
    /** Opens the panel */
    open: () => void;
    /** Closes the panel */
    close: () => void;
    /**
     * Focuses the input; a range focuses its start input unless `rangeEnd` is given. With `insetInput` and the panel
     * open the focus goes to the input in the panel, as the trigger is disabled.
     */
    focus: (focusType?: RangeInput) => void;
    blur: () => void;
}

export type DatePickerElement = HTMLDivElement & DatePickerHandle;

/** What `triggerRender` gets, every key live; `componentProps` are the props of the DatePicker, without `ref` */
export interface TriggerRenderProps extends DateInputProps {
    componentProps: Omit<DatePickerProps, 'ref'>;
}

export type DatePickerState = DatePickerFoundationState;

type FoundationProps = DatePickerFoundationProps;
type Foundation = DatePickerFoundation;
type Adapter = DatePickerAdapter;

const defaultProps = {
    borderless: false,
    autoAdjustOverflow: true,
    stopPropagation: true,
    motion: true,
    prefixCls: cssClasses.PREFIX,
    presetPosition: 'bottom',
    type: 'date',
    size: 'default',
    density: 'default',
    multiple: false,
    defaultOpen: false,
    hideDisabledOptions: false,
    weekStartsOn: numbers.WEEK_START_ON,
    disabledDate: () => false,
    disabledTime: () => ({}),
    inputReadOnly: false,
    autoSwitchDate: true,
    syncSwitchMonth: false,
    rangeSeparator: strings.DEFAULT_SEPARATOR_RANGE,
    insetInput: false,
} satisfies Partial<DatePickerProps>;

function hasRangeInputs(type: Type | undefined, triggerRender: DatePickerProps['triggerRender']) {
    return isRangeType(type) && typeof triggerRender !== 'function';
}

export default function DatePicker(rawProps: DatePickerProps) {
    const defaulted = useDefaultProps('DatePicker', rawProps, defaultProps);

    const config = useConfig();
    const locale = useLocale('DatePicker');

    let root: HTMLDivElement | undefined;
    let monthGrid: MonthsGridHandle | undefined;
    const [panel, setPanel] = createSignal<HTMLDivElement>();
    const [combobox, setCombobox] = createSignal<HTMLDivElement>();

    // only the rendered DOM tells whether a custom trigger has its own focus target
    const [customTriggerFocusable, setCustomTriggerFocusable] = createSignal(false);

    const normalized = createMemo(() => DatePickerFoundation.normalizeProps(defaulted));

    // An explicit undefined timeZone falls back too: prop, then ConfigProvider, then the global default; the locale is
    // never a prop
    const props = mergeProps(defaulted, {
        get timeZone() {
            return rawProps.timeZone ?? config().timeZone ?? defaulted.timeZone;
        },
        get dateFnsLocale() {
            return locale().dateFnsLocale;
        },
        get type() {
            return normalized().type;
        },
        get rangeSeparator() {
            return normalized().rangeSeparator;
        },
        get position() {
            return normalized().position;
        },
        get spacing() {
            return normalized().spacing;
        },
    }) as DatePickerProps & Required<Pick<DatePickerProps, keyof typeof defaultProps>> & { type: Type; dateFnsLocale: FoundationProps['dateFnsLocale']; spacing: number };

    // validateStatus, insetLabel and insetLabelId are read from props: the Form-injected keys never reach the split
    const [local, rest] = splitProps(omitFormInjected(props), [
        'aria-describedby',
        'aria-errormessage',
        'aria-invalid',
        'aria-labelledby',
        'aria-required',
        'autoAdjustOverflow',
        'autofocus',
        'autoSwitchDate',
        'borderless',
        'bottomSlot',
        'class',
        'clearIcon',
        'dateFnsLocale',
        'defaultOpen',
        'defaultPickerValue',
        'defaultValue',
        'density',
        'disabled',
        'disabledDate',
        'disabledTime',
        'disabledTimePicker',
        'dropdownClassName',
        'dropdownStyle',
        'endDateOffset',
        'endYear',
        'format',
        'hideDisabledOptions',
        'inputReadOnly',
        'inputStyle',
        'insetInput',
        'leftSlot',
        'max',
        'motion',
        'multiple',
        'needConfirm',
        'onBlur',
        'onCancel',
        'onChange',
        'onClear',
        'onClickOutSide',
        'onConfirm',
        'onFocus',
        'onMouseDown',
        'onOpenChange',
        'onPanelChange',
        'onPresetClick',
        'open',
        'placeholder',
        'position',
        'prefix',
        'prefixCls',
        'presetPosition',
        'presets',
        'preventScroll',
        'rangeSeparator',
        'rangeSeparatorNode',
        'ref',
        'renderDate',
        'renderFullDate',
        'rightSlot',
        'showClear',
        'size',
        'spacing',
        'startDateOffset',
        'startYear',
        'stopPropagation',
        'style',
        'syncSwitchMonth',
        // Tooltip adds it to its child: it belongs to the input, the Tab stop
        'tabIndex',
        'timePickerOpts',
        'timeZone',
        'topSlot',
        'triggerRender',
        'type',
        'value',
        'weekStartsOn',
        'yearAndMonthOpts',
    ]);

    // a triggerRender that spreads componentProps must not grab the root element
    const [, componentProps] = splitProps(props, ['ref']);

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const panelId = createUniqueId();

    // the native inputs: the trigger's, and the ones in the panel with insetInput, which unmount on close
    const inputs: Partial<Record<'single' | 'triggerStart' | 'triggerEnd' | 'insetStart' | 'insetEnd', HTMLInputElement>> = {};

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, DatePickerState>(
        DatePickerFoundation,
        props as FoundationProps,
        (view) => ({
            panelShow: Boolean(view.open || view.defaultOpen),
            isRange: false,
            ...DatePickerFoundation.getInitialState(view),
            autofocus: Boolean(props.autofocus || (hasRangeInputs(view.type, props.triggerRender) && (view.open || view.defaultOpen))),
            insetInputValue: null,
            triggerDisabled: null,
            focusRecords: { rangeStart: false, rangeEnd: false },
        }),
        (base) => ({
            togglePanel: (panelShow, cb) => base.setState({ panelShow }, cb),
            notifyBlur: (e) => props.onBlur?.(e),
            notifyFocus: (e, rangeType) => props.onFocus?.(e, rangeType),
            notifyClear: (e) => props.onClear?.(e),
            notifyChange: (date, dateStr) => props.onChange?.(date, dateStr),
            notifyCancel: (date, dateStr) => props.onCancel?.(date, dateStr),
            notifyConfirm: (date, dateStr) => props.onConfirm?.(date, dateStr),
            notifyOpenChange: (open) => props.onOpenChange?.(open),
            notifyClickOutSide: (e) => props.onClickOutSide?.(e),
            notifyPresetsClick: (item, e) => props.onPresetClick?.(item, e),
            updateValue: (value) => base.setState({ value }),
            updatePrevTimezone: (prevTimeZone) => base.setState({ prevTimeZone }),
            updateCachedSelectedValue: (cachedSelectedValue) => base.setState({ cachedSelectedValue }),
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            updateInsetInputValue: (insetInputValue) => {
                if (props.insetInput && !isEqual(insetInputValue, base.getState('insetInputValue'))) {
                    base.setState({ insetInputValue });
                }
            },
            setRangeInputFocus: (rangeInputFocus) => {
                const focusOptions = { preventScroll: props.preventScroll };
                // focus first: its onFocus must still read the previous rangeInputFocus
                if (rangeInputFocus === 'rangeStart') {
                    (inputs.insetStart ?? inputs.triggerStart)?.focus(focusOptions);
                } else if (rangeInputFocus === 'rangeEnd') {
                    (inputs.insetEnd ?? inputs.triggerEnd)?.focus(focusOptions);
                }
                if (rangeInputFocus !== base.getState('rangeInputFocus')) {
                    base.setState({ rangeInputFocus });
                }
            },
            isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panel()),
            isEventTarget: (e) => Boolean(e) && e.target === e.currentTarget,
            setInsetInputFocus: () => {
                const input = base.getState('rangeInputFocus') === 'rangeEnd' ? inputs.insetEnd : inputs.insetStart;
                if (input && FocusTrapHandle.getActiveElement(input) !== input) {
                    input.focus({ preventScroll: props.preventScroll });
                }
            },
            setInputFocus: () => inputs.single?.focus({ preventScroll: props.preventScroll }),
            setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(combobox(), { preventScroll: props.preventScroll }),
            blurFocusedElement: () => {
                const active = FocusTrapHandle.getActiveElement(root);
                if (active instanceof HTMLElement && (root?.contains(active) || panel()?.contains(active))) {
                    active.blur();
                }
            },
            setTriggerDisabled: (triggerDisabled, callback) => base.setState({ triggerDisabled }, callback),
        })
    );

    // a new value prop wins (back to undefined clears it), else a new timeZone re-zones the shown value. By value: a
    // Date or array rebuilt by the owner is a new object and must not reset the panel
    const syncInputs = createMemo(() => ({ value: local.value, timeZone: local.timeZone }), undefined, {
        equals: (a, b) => isEqual(a.value, b.value) && a.timeZone === b.timeZone,
    });

    const panelShow = () => DatePickerFoundation.isPanelShown(props, state());

    const markPressInside = useClickOutside([() => root, panel], (e) => foundation.handleClickOutside(e), panelShow);

    const isConfirmNeeded = () => needConfirm(props);

    const isYearOrMonth = () => isYearOrMonthType(local.type);

    const isRange = () => hasRangeInputs(local.type, local.triggerRender);

    const inputDisabled = () => Boolean(local.disabled || (local.insetInput && state().triggerDisabled));

    const position = () => local.position ?? (config().direction === 'rtl' ? 'bottomRight' : 'bottomLeft');

    const hasPresets = () => Boolean(local.presets?.length);

    const valueLabel = () => (state().value.length ? locale().locale.changeDate : locale().locale.chooseDate);

    // without a focus target of its own, the custom trigger's wrapper is the Tab stop and acts as the button
    const isTriggerButton = () => typeof local.triggerRender === 'function' && !customTriggerFocusable();

    const triggerOwn = {
        ref: setCombobox,
        get class() {
            const prefix = cssClasses.PREFIX;
            return clsx(`${prefix}-input`, {
                [`${prefix}-range-input`]: isRange(),
                [`${prefix}-range-input-${local.size}`]: isRange() && local.size,
                [`${prefix}-range-input-active`]: isRange() && state().rangeInputFocus && !inputDisabled(),
                [`${prefix}-range-input-disabled`]: isRange() && inputDisabled(),
                [`${prefix}-range-input-${props.validateStatus}`]: isRange() && props.validateStatus,
                [`${prefix}-borderless`]: local.borderless,
            });
        },
        get role() {
            return isTriggerButton() ? 'button' : undefined;
        },
        // the inputs or a focusable custom trigger are the Tab stop; Tooltip would add 0 here
        get tabIndex() {
            return isTriggerButton() && !local.disabled ? 0 : -1;
        },
        // aria-required is not supported by the button role
        get 'aria-describedby'() {
            return isTriggerButton() ? local['aria-describedby'] : undefined;
        },
        get 'aria-disabled'() {
            return isTriggerButton() ? Boolean(local.disabled) : undefined;
        },
        get 'aria-errormessage'() {
            return isTriggerButton() ? local['aria-errormessage'] : undefined;
        },
        get 'aria-invalid'() {
            return isTriggerButton() ? local['aria-invalid'] : undefined;
        },
        get 'aria-label'() {
            return isTriggerButton() && !local['aria-labelledby'] ? valueLabel() : undefined;
        },
        get 'aria-labelledby'() {
            return isTriggerButton() ? local['aria-labelledby'] : undefined;
        },
        get 'aria-controls'() {
            return isTriggerButton() ? panelId : null;
        },
        get 'aria-expanded'() {
            return isTriggerButton() ? panelShow() : null;
        },
        get 'aria-haspopup'() {
            return isTriggerButton() ? ('dialog' as const) : null;
        },
        onClick: (e: MouseEvent) => foundation.handleTriggerClick(e, typeof local.triggerRender === 'function'),
        // a control inside the trigger (the range clear button, a custom trigger's own) keeps its keys
        onKeyDown: (e: KeyboardEvent) => {
            if (!isInnerControlKey(e)) {
                foundation.handleTriggerKeyDown(e, isTriggerButton() && e.target === e.currentTarget);
            }
        },
    };

    // the panel calls them while rendering, so they read the current props
    const disabledDisposeDate = (date: Date, options?: DisabledDateOptions) => DatePickerFoundation.disposeDateFn(local.timeZone, local.disabledDate, date, options);

    const disabledDisposeTime = (date: Date | Date[], panelType?: string) => DatePickerFoundation.disposeDateFn(local.timeZone, local.disabledTime, date, panelType);

    // a ref callback that also forgets the input once it unmounts
    const keepInput = (key: keyof typeof inputs) => (node: HTMLInputElement) => {
        inputs[key] = node;
        onCleanup(() => {
            if (inputs[key] === node) {
                inputs[key] = undefined;
            }
        });
    };

    // also passed to triggerRender as its public props: do not drop keys
    const inputProps: DateInputProps = {
        get borderless() {
            return isRangeType(local.type) ? undefined : local.borderless;
        },
        get showClearIgnoreDisabled() {
            return Boolean(local.insetInput);
        },
        get placeholder() {
            return local.placeholder || (locale().locale.placeholder as Record<string, string | [string, string] | undefined>)[local.type];
        },
        // APG date picker combobox: the inputs that open the panel carry the popup state
        role: 'combobox',
        'aria-controls': panelId,
        get 'aria-expanded'() {
            return panelShow();
        },
        'aria-haspopup': 'dialog',
        get 'aria-labelledby'() {
            return local['aria-labelledby'];
        },
        // the focused input carries the field state; the roleless wrapper cannot
        get 'aria-describedby'() {
            return local['aria-describedby'];
        },
        get 'aria-errormessage'() {
            return local['aria-errormessage'];
        },
        get 'aria-invalid'() {
            return local['aria-invalid'];
        },
        get 'aria-required'() {
            return local['aria-required'];
        },
        get 'aria-label'() {
            return local['aria-labelledby'] ? undefined : valueLabel();
        },
        get clearIcon() {
            return local.clearIcon;
        },
        get locale() {
            return locale().locale;
        },
        get tabIndex() {
            return local.tabIndex;
        },
        get disabled() {
            return inputDisabled();
        },
        get inputValue() {
            return state().inputValue;
        },
        get value() {
            return state().value;
        },
        get defaultPickerValue() {
            return local.defaultPickerValue;
        },
        onChange: (input, e) => foundation.handleInputChange(input, e),
        onEnterPress: (input) => foundation.handleInputComplete(input),
        block: true,
        get inputStyle() {
            return local.inputStyle;
        },
        get showClear() {
            return local.showClear;
        },
        get insetLabel() {
            return props.insetLabel;
        },
        get insetLabelId() {
            return props.insetLabelId;
        },
        get type() {
            return local.type;
        },
        get format() {
            return local.format;
        },
        get multiple() {
            return local.multiple;
        },
        get validateStatus() {
            return props.validateStatus;
        },
        get inputReadOnly() {
            return local.inputReadOnly || Boolean(local.insetInput);
        },
        onFocus: (e, range) => foundation.handleInputFocus(e, range as RangeInput),
        onClear: (e) => foundation.handleInputClear(e),
        get prefix() {
            return local.prefix;
        },
        get size() {
            return local.size;
        },
        get autofocus() {
            return state().autofocus;
        },
        get dateFnsLocale() {
            return local.dateFnsLocale;
        },
        get rangeInputFocus() {
            return state().rangeInputFocus;
        },
        get rangeSeparator() {
            return local.rangeSeparator;
        },
        get rangeSeparatorNode() {
            return local.rangeSeparatorNode;
        },
        onRangeClear: (e) => foundation.handleRangeInputClear(e),
        onRangeEndTabPress: () => foundation.handleRangeEndTabPress(),
        rangeInputStartRef: keepInput('triggerStart'),
        rangeInputEndRef: keepInput('triggerEnd'),
        inputRef: keepInput('single'),
    };

    const triggerRenderProps = mergeProps(inputProps, { componentProps }) as TriggerRenderProps;

    const setRoot = (node: HTMLDivElement) => {
        root = node;
        // React's handle methods ride on the element; focus() takes the range input instead of focus options
        Object.assign(node, {
            open: () => foundation.open(),
            close: () => foundation.close(),
            focus: (focusType?: RangeInput | FocusOptions) => foundation.focus(typeof focusType === 'string' ? focusType : undefined),
            blur: () => foundation.blur(),
        });
        registerTrigger(node);
    };

    const handleMouseDown = (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onMouseDown, e);
        markPressInside(e);
    };

    // null without presets: MonthsGrid sizes the panel by whether a side column exists
    const renderQuickControls = () => (
        <Show when={hasPresets()}>
            <QuickControl type={local.type} insetInput={local.insetInput} locale={locale().locale} presetPosition={local.presetPosition} presets={local.presets} onPresetClick={(item, e) => foundation.handlePresetClick(item, e)} />
        </Show>
    );

    const renderDateInput = () => (
        <Show when={local.insetInput}>
            <DateInput
                type={local.type}
                value={state().value}
                dateFnsLocale={local.dateFnsLocale}
                defaultPickerValue={local.defaultPickerValue}
                density={local.density}
                format={local.format}
                insetInput={local.insetInput}
                insetInputValue={state().insetInputValue ?? undefined}
                locale={locale().locale}
                rangeInputEndRef={keepInput('insetEnd')}
                rangeInputStartRef={keepInput('insetStart')}
                rangeSeparator={local.rangeSeparator}
                rangeSeparatorNode={local.rangeSeparatorNode}
                handleInsetDateFocus={(e, rangeType) => {
                    monthGrid?.showDatePanel(strings.PANEL_TYPE_LEFT);
                    monthGrid?.showDatePanel(strings.PANEL_TYPE_RIGHT);
                    foundation.handleInputFocus(e, rangeType);
                }}
                handleInsetTimeFocus={() => {
                    monthGrid?.showTimePicker(strings.PANEL_TYPE_LEFT);
                    monthGrid?.showTimePicker(strings.PANEL_TYPE_RIGHT);
                }}
                onInsetInputChange={(options) => foundation.handleInsetInputChange(options)}
            />
        </Show>
    );

    const renderMonthGrid = () => (
        <MonthsGrid
            ref={(handle) => {
                monthGrid = handle;
                onCleanup(() => {
                    if (monthGrid === handle) {
                        monthGrid = undefined;
                    }
                });
            }}
            type={local.type}
            max={local.max}
            multiple={local.multiple}
            autoSwitchDate={local.autoSwitchDate}
            dateFnsLocale={local.dateFnsLocale}
            defaultPickerValue={local.defaultPickerValue}
            density={local.density}
            disabledDate={disabledDisposeDate}
            disabledTime={disabledDisposeTime}
            disabledTimePicker={local.disabledTimePicker}
            endDateOffset={local.endDateOffset}
            endYear={local.endYear}
            focusRecords={state().focusRecords}
            format={local.format}
            hasOtherRangeInputBeenFocused={(currentRangeInput) => foundation.hasOtherRangeInputBeenFocused(currentRangeInput)}
            hasPresets={hasPresets()}
            hideDisabledOptions={local.hideDisabledOptions}
            insetInput={local.insetInput}
            isControlledComponent={!isConfirmNeeded() && local.value !== undefined}
            locale={locale().locale}
            presetPosition={local.presetPosition}
            rangeInputFocus={state().rangeInputFocus}
            selectedValue={state().cachedSelectedValue}
            setRangeInputFocus={(focus) => foundation.handleSetRangeFocus(focus)}
            startDateOffset={local.startDateOffset}
            startYear={local.startYear}
            syncSwitchMonth={local.syncSwitchMonth}
            timePickerOpts={local.timePickerOpts}
            timeZone={local.timeZone}
            weekStartsOn={local.weekStartsOn}
            yearAndMonthOpts={local.yearAndMonthOpts}
            renderDate={local.renderDate}
            renderDateInput={renderDateInput}
            renderFullDate={local.renderFullDate}
            renderQuickControls={renderQuickControls}
            onChange={(v, options) => foundation.handleSelectedChange(v, options)}
            onPanelChange={local.onPanelChange}
        />
    );

    const renderYearMonthPanel = () => {
        const yearAndMonth = () => getYearMonthFromValue(state().value, local.type);
        return (
            <YearAndMonth
                type={local.type}
                currentMonth={yearAndMonth().month}
                currentYear={yearAndMonth().year}
                density={local.density}
                disabledDate={disabledDisposeDate}
                endYear={local.endYear}
                locale={locale().locale}
                monthCycled
                noBackBtn
                presetPosition={local.presetPosition}
                startYear={local.startYear}
                yearAndMonthOpts={local.yearAndMonthOpts}
                renderDateInput={renderDateInput}
                renderQuickControls={renderQuickControls}
                onSelect={(item) => foundation.handleYMSelectedChange(item)}
            />
        );
    };

    const renderFooter = () => (
        <Show when={isConfirmNeeded()}>
            <Footer disabledConfirm={isRangeType(local.type) && !isRangeValueComplete(state().cachedSelectedValue)} locale={locale().locale} prefixCls={local.prefixCls} onCancelClick={() => foundation.handleCancel()} onConfirmClick={() => foundation.handleConfirm()} />
        </Show>
    );

    const renderSlot = (slot: () => JSX.Element, name: string) => {
        const resolved = children(slot);
        return (
            <Show when={hasContent(resolved())}>
                <div class={`${cssClasses.PREFIX}-${name}`} x-semi-prop={name}>
                    {resolved()}
                </div>
            </Show>
        );
    };

    const renderPanel = () => (
        // the delegated handler sees a press in a popup portaled from the panel before the popup stops it
        <div
            ref={setPanel}
            id={panelId}
            class={clsx(
                cssClasses.PREFIX,
                {
                    [cssClasses.PANEL_YAM]: isYearOrMonth(),
                    [`${cssClasses.PREFIX}-compact`]: local.density === 'compact',
                },
                local.dropdownClassName
            )}
            style={local.dropdownStyle}
            x-type={local.type}
            onMouseDown={markPressInside}
        >
            <div class={`${cssClasses.PREFIX}-container`}>
                {renderSlot(() => local.leftSlot, 'leftSlot')}
                <div>
                    {renderSlot(() => local.topSlot, 'topSlot')}
                    <Show when={local.presetPosition === 'top' && local.type !== 'monthRange'}>{renderQuickControls()}</Show>
                    <Show when={isYearOrMonth()} fallback={renderMonthGrid()}>
                        {renderYearMonthPanel()}
                    </Show>
                    <Show when={local.presetPosition === 'bottom' && local.type !== 'monthRange'}>{renderQuickControls()}</Show>
                    {renderSlot(() => local.bottomSlot, 'bottomSlot')}
                </div>
                {renderSlot(() => local.rightSlot, 'rightSlot')}
            </div>
            {renderFooter()}
        </div>
    );

    // not useWatch: init in onMount reads value, timeZone, open and disabled, so the baseline is the inputs at each
    // effect's first run, right after init; a creation-time baseline would re-zone a timeZone a parent changed before
    // init a second time
    createEffect(
        on(syncInputs, (current, previous) => {
            if (!previous) {
                return;
            }
            if (!isEqual(previous.value, current.value)) {
                foundation.initFromProps({ value: current.value, timeZone: current.timeZone });
            } else if (current.timeZone !== previous.timeZone) {
                foundation.initFromProps({ value: foundation.getState('value'), timeZone: current.timeZone, prevTimeZone: previous.timeZone });
            }
        })
    );

    createEffect(
        on(
            createMemo(() => local.open),
            (open) => (open ? foundation.handleControlledOpen() : foundation.handleControlledClose()),
            { defer: true }
        )
    );

    createEffect(
        on(
            createMemo(() => Boolean(local.disabled)),
            (disabled) => {
                if (disabled && DatePickerFoundation.isPanelShown({ open: local.open, disabled: false }, foundation.getStates())) {
                    foundation.deactivate();
                }
            },
            { defer: true }
        )
    );

    // Known limit: measured when triggerRender changes, or the wrapper mounts; a stable one that switches between
    // focusable and plain markup needs a MutationObserver
    createEffect(
        on([() => local.triggerRender, combobox], ([render, element]) => {
            if (typeof render === 'function' && element) {
                setCustomTriggerFocusable(FocusTrapHandle.getFocusableElements(element).length > 0);
            }
        })
    );

    return (
        <div
            {...rest}
            // setRoot runs first and adds the handle methods, so the consumer gets a DatePickerElement
            ref={mergeRefs<HTMLDivElement>(setRoot, local.ref as Ref<HTMLDivElement> | undefined)}
            class={clsx(local.class, local.prefixCls)}
            style={local.style}
            aria-labelledby={isRange() ? local['aria-labelledby'] : undefined}
            role={(isRange() ? (rest.role ?? 'group') : namedRole(rest.role, rest['aria-label'], undefined)) as JSX.HTMLAttributes<HTMLDivElement>['role']}
            onMouseDown={handleMouseDown}
        >
            <Popover
                aria-label={locale().locale.panel[local.type]}
                afterClose={() => foundation.handlePanelVisibleChange(false)}
                autoAdjustOverflow={local.autoAdjustOverflow}
                content={renderPanel}
                motion={local.motion}
                position={position()}
                spacing={local.spacing}
                stopPropagation={local.stopPropagation}
                trigger="custom"
                visible={panelShow()}
                // the trigger is custom, so the Popover leaves closing on Esc to the DatePicker
                onEscKeyDown={() => foundation.handleEscKeyDown()}
                onOpen={() => foundation.handlePanelVisibleChange(true)}
            >
                {(getTriggerProps) => (
                    <div {...(getTriggerProps(triggerOwn) as JSX.HTMLAttributes<HTMLDivElement>)}>
                        <Show when={local.triggerRender} keyed fallback={<DateInput {...inputProps} />}>
                            {(render) => render(triggerRenderProps)}
                        </Show>
                    </div>
                )}
            </Popover>
        </div>
    );
}
