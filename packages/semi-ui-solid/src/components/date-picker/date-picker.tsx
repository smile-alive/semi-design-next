import { type JSX, type Ref, Show, children, createEffect, createMemo, createSignal, createUniqueId, mergeProps, on, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import FocusTrapHandle from '@fibrae/semi-foundation/base/focus-handle';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/components/date-picker/constants';
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
    type DisabledDateOptions,
    type PresetType,
    type RangeInput,
    type Type,
} from '@fibrae/semi-foundation/components/date-picker/foundation';
import { isInnerControlKey, namedRole } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/components/date-picker/date-picker.scss';
import type { ElementProps } from '../../base/element-props';
import { usePopupLayer } from '../../base/popup-layer';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import useClickOutside from '../../primitives/use-click-outside';
import callHandler from '../../utils/call-handler';
import { omitFormInjected } from '../../utils/control-attrs';
import hasContent from '../../utils/has-content';
import mergeRefs from '../../utils/merge-refs';
import useConfig from '../config-provider/use-config';
import { InputGroupContext, useInputGroupContext } from '../input/context';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import type { Position } from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';
import DateInput, { type DateInputProps } from './date-input';
import Footer from './footer';
import MonthsGrid, { type DatePickerTimePickerOpts, type MonthsGridHandle } from './months-grid';
import QuickControl from './quick-control';
import YearAndMonth, { type YearAndMonthOpts } from './year-and-month';

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
    ref?: Ref<DatePickerElement>;
}

/** React's DatePickerHandle methods; the root element passed to `ref` carries them */
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
    const group = useInputGroupContext();
    const layer = usePopupLayer();
    const locale = useLocale('DatePicker');

    let root: HTMLDivElement | undefined;
    let monthGrid: MonthsGridHandle | undefined;
    const [panel, setPanel] = createSignal<HTMLDivElement>();
    const [combobox, setCombobox] = createSignal<HTMLDivElement>();

    // only the rendered DOM tells whether a custom trigger has its own focus target
    const [customTriggerFocusable, setCustomTriggerFocusable] = createSignal(false);

    const inGroup = group?.layer === layer ? group : undefined;
    const normalized = createMemo(() => DatePickerFoundation.normalizeProps(defaulted));

    // An explicit undefined timeZone falls back too: prop, then ConfigProvider, then the global default; the locale is
    // never a prop. As Input: own value, then the group's, then the global default.
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

    // customTrigger stays out of props: they reach the root element and triggerRender's componentProps
    const foundationProps = mergeProps(props as FoundationProps, {
        get customTrigger() {
            return typeof props.triggerRender === 'function';
        },
    });

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const panelId = createUniqueId();

    // the native inputs: the trigger's, and the ones in the panel with insetInput, which unmount on close
    const inputs: Partial<Record<'single' | 'triggerStart' | 'triggerEnd' | 'insetStart' | 'insetEnd', HTMLInputElement>> = {};

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, DatePickerState>(
        DatePickerFoundation,
        foundationProps,
        // Solid names the prop `autofocus`, while the foundation reads `autoFocus`; a getter on the shared props would
        // reach the root element and triggerRender's componentProps
        (view) => DatePickerFoundation.getInitialState(mergeProps(view, { autoFocus: props.autofocus })),
        (base) => ({
            notifyBlur: (e) => props.onBlur?.(e),
            notifyFocus: (e, rangeType) => props.onFocus?.(e, rangeType),
            notifyClear: (e) => props.onClear?.(e),
            notifyChange: (date, dateStr) => props.onChange?.(date, dateStr),
            notifyCancel: (date, dateStr) => props.onCancel?.(date, dateStr),
            notifyConfirm: (date, dateStr) => props.onConfirm?.(date, dateStr),
            notifyOpenChange: (open) => props.onOpenChange?.(open),
            notifyClickOutSide: (e) => props.onClickOutSide?.(e),
            notifyPresetsClick: (item, e) => props.onPresetClick?.(item, e),
            focusRangeInput: (rangeInput) => {
                const input = rangeInput === 'rangeEnd' ? (inputs.insetEnd ?? inputs.triggerEnd) : (inputs.insetStart ?? inputs.triggerStart);
                input?.focus({ preventScroll: props.preventScroll });
            },
            switchPanels: (view) => monthGrid?.switchPanels(view),
            isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panel()),
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
        })
    );

    const panelShow = () => DatePickerFoundation.isPanelShown(props, state());

    const markPressInside = useClickOutside([() => root, panel], foundation.handleClickOutside, panelShow);

    const isConfirmNeeded = () => needConfirm(props);

    const isYearOrMonth = () => isYearOrMonthType(local.type);

    const isRange = () => hasRangeInputs(local.type, local.triggerRender);

    const inputDisabled = () => Boolean(local.disabled || (local.insetInput && state().triggerDisabled));

    const position = () => DatePickerFoundation.getPosition(local.position, config().direction);

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
        onClick: foundation.handleTriggerClick,
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
        onChange: foundation.handleInputChange,
        onEnterPress: foundation.handleInputComplete,
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
        onClear: foundation.handleInputClear,
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
        onRangeClear: foundation.handleRangeInputClear,
        onRangeEndTabPress: foundation.handleRangeEndTabPress,
        rangeInputStartRef: keepInput('triggerStart'),
        rangeInputEndRef: keepInput('triggerEnd'),
        inputRef: keepInput('single'),
    };

    const triggerRenderProps = mergeProps(inputProps, { componentProps }) as TriggerRenderProps;

    const setRoot = (node: HTMLDivElement) => {
        root = node;
        // React's handle methods ride on the element; focus() takes the range input instead of focus options
        Object.assign(node, {
            open: foundation.open,
            close: () => foundation.close(),
            focus: (focusType?: RangeInput | FocusOptions) => foundation.focus(typeof focusType === 'string' ? focusType : undefined),
            blur: foundation.blur,
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
            <QuickControl type={local.type} insetInput={local.insetInput} locale={locale().locale} presetPosition={local.presetPosition} presets={local.presets} onPresetClick={foundation.handlePresetClick} />
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
                handleInsetDateFocus={foundation.handleInsetDateFocus}
                handleInsetTimeFocus={foundation.handleInsetTimeFocus}
                onInsetInputChange={foundation.handleInsetInputChange}
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
            hasPresets={hasPresets()}
            hideDisabledOptions={local.hideDisabledOptions}
            insetInput={local.insetInput}
            locale={locale().locale}
            presetPosition={local.presetPosition}
            rangeInputFocus={state().rangeInputFocus}
            selectedValue={state().cachedSelectedValue}
            selectionControlled={DatePickerFoundation.isSelectionControlled(props)}
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
            onChange={foundation.handleSelectedChange}
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
                onSelect={foundation.handleYMSelectedChange}
            />
        );
    };

    const renderFooter = () => (
        <Show when={isConfirmNeeded()}>
            <Footer disabledConfirm={isRangeType(local.type) && !isRangeValueComplete(state().cachedSelectedValue)} locale={locale().locale} prefixCls={local.prefixCls} onCancelClick={foundation.handleCancel} onConfirmClick={foundation.handleConfirm} />
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
        // the inputs and any trigger content belong to the DatePicker, not to an enclosing InputGroup
        <InputGroupContext.Provider value={undefined}>
            <div
                {...rest}
                // setRoot runs first and adds the handle methods, so the consumer gets a DatePickerElement
                ref={untrack(() => mergeRefs<HTMLDivElement>(setRoot, local.ref as Ref<HTMLDivElement> | undefined))}
                class={clsx(local.class, local.prefixCls)}
                style={local.style}
                aria-labelledby={isRange() ? local['aria-labelledby'] : undefined}
                role={isRange() ? (rest.role ?? 'group') : namedRole({ role: rest.role, 'aria-label': rest['aria-label'] })}
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
                    onEscKeyDown={foundation.handleEscKeyDown}
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
        </InputGroupContext.Provider>
    );
}
