import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { WeekStartNumber } from '@fibrae/semi-foundation/date-picker/_utils/get-month-table';
import type { BaseValueType, DateOffsetType, DayStatusType, DensityType, DisabledDateOptions, DisabledDateType, DisabledTimeType, PresetPosition, PresetType, PresetsType, Type, ValueType } from '@fibrae/semi-foundation/date-picker/foundation';
import type { InsetInputProps, RangeInput } from '@fibrae/semi-foundation/date-picker/input-foundation';
import type { InputSize, ValidateStatus } from '../input/index.js';
import type { ScrollItemProps } from '../scroll-list/index.js';
import type { ComboboxProps } from '../time-picker/interface.js';
import type { Position } from '../tooltip/index.js';

export type DatePickerBaseValueType = BaseValueType;
/** A date as `value` accepts it: a Date, a timestamp or a string in `format`; an array for range and multiple */
export type DatePickerValueType = ValueType;
export type DatePickerDayStatusType = DayStatusType;
export type DatePickerDisabledDateOptions = DisabledDateOptions;
export type DatePickerDisabledDateType = DisabledDateType;
export type DatePickerDisabledTimeType = DisabledTimeType;
export type DatePickerPresetType = PresetType;
export type DatePickerPresetsType = PresetsType;
export type DatePickerPresetPosition = PresetPosition;
export type DatePickerDensity = DensityType;
export type DatePickerDateOffsetType = DateOffsetType;
export type DatePickerInsetInputProps = InsetInputProps;
export type DatePickerRangeInput = RangeInput;
export type DatePickerType = Type;

/** The time panel options a caller may set; the panel owns the format, the value and the disabled times */
export type DatePickerTimePickerOpts = Partial<Pick<ComboboxProps, 'use12Hours' | 'hourStep' | 'minuteStep' | 'secondStep' | 'defaultIsAM' | 'scrollItemProps'>>;

/** The year and month column options a caller may set; the panel owns the list and the selection */
export type DatePickerYearAndMonthOpts = Partial<Pick<ScrollItemProps, 'cycled' | 'mode' | 'motion' | 'transform'>>;

/** The methods a `bind:this` reference to DatePicker exposes */
export interface DatePickerHandle {
    open: () => void;
    close: () => void;
    /** A range focuses its start input unless `rangeEnd` is given */
    focus: (focusType?: DatePickerRangeInput) => void;
    blur: () => void;
}

export interface DatePickerDateSnippetProps {
    dayNumber: number;
    /** yyyy-MM-dd */
    fullDate: string;
}

export interface DatePickerFullDateSnippetProps extends DatePickerDateSnippetProps {
    dayStatus: DatePickerDayStatusType;
}

// The root takes class, style and the other attributes; the field state (aria-labelledby, aria-describedby,
// aria-invalid, aria-required, aria-errormessage, tabindex) goes to the input that gets the focus.
type NativeRootKeys = 'children' | 'prefix' | 'placeholder' | 'onchange' | 'onfocus' | 'onblur';

export interface DatePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeRootKeys> {
    /** Bindable. `null` is a controlled empty value; only `undefined` leaves the picker uncontrolled */
    value?: DatePickerValueType | null;
    /** Bindable */
    open?: boolean;
    /** A format without time tokens turns dateTime into date and dateTimeRange into dateRange */
    type?: DatePickerType;
    format?: string;
    /** The month the panel shows while there is no value */
    defaultPickerValue?: DatePickerValueType;
    /** Only for the date type */
    multiple?: boolean;
    max?: number;
    /** Only for dateTime and dateTimeRange */
    needConfirm?: boolean;
    disabled?: boolean;
    disabledDate?: DatePickerDisabledDateType;
    disabledTime?: DatePickerDisabledTimeType;
    disabledTimePicker?: boolean;
    hideDisabledOptions?: boolean;
    startDateOffset?: DatePickerDateOffsetType;
    endDateOffset?: DatePickerDateOffsetType;
    /** Defaults to the locale's placeholder of `type` */
    placeholder?: string | string[];
    /** Separates the range in the input text and parses it; the `rangeSeparatorNode` snippet only changes how it is shown */
    rangeSeparator?: string;
    size?: InputSize;
    density?: DatePickerDensity;
    borderless?: boolean;
    showClear?: boolean;
    inputReadOnly?: boolean;
    /** Style of the Input's root element */
    inputStyle?: string;
    /** Moves the inputs into the panel */
    insetInput?: boolean | DatePickerInsetInputProps;
    insetLabelId?: string;
    validateStatus?: ValidateStatus;
    /** Focuses the input on mount, which opens the panel */
    autofocus?: boolean;
    preventScroll?: boolean;
    weekStartsOn?: WeekStartNumber;
    startYear?: number;
    endYear?: number;
    autoSwitchDate?: boolean;
    syncSwitchMonth?: boolean;
    /** A function item, and a function `start` or `end`, is called when the presets render or are clicked */
    presets?: DatePickerPresetsType;
    presetPosition?: DatePickerPresetPosition;
    timePickerOpts?: DatePickerTimePickerOpts;
    yearAndMonthOpts?: DatePickerYearAndMonthOpts;
    /** Falls back to ConfigProvider's timeZone */
    timeZone?: string | number;
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    /** Defaults to leftTopOver with `insetInput`, else bottomLeft (bottomRight in RTL) */
    position?: Position;
    /** Defaults to 1 for an `insetInput` panel over the trigger, else the Popover spacing */
    spacing?: number;
    stopPropagation?: boolean | string;
    dropdownClassName?: string;
    dropdownStyle?: string;
    /** `undefined` (single) or `[]` (range and multiple) when cleared */
    onChange?: (date: Date | Date[] | undefined, dateString: string | string[]) => void;
    onOpenChange?: (open: boolean) => void;
    /**
     * focusin of an input, or the click or key press on the trigger that focused the range start; `rangeType` is set
     * for the range inputs only, and moving between them does not fire it again
     */
    onFocus?: (event: FocusEvent | MouseEvent | KeyboardEvent, rangeType?: DatePickerRangeInput) => void;
    /** Fires when the panel closes: with the mousedown outside that closed it, otherwise without an event */
    onBlur?: (event?: MouseEvent) => void;
    onClear?: (event: MouseEvent) => void;
    onCancel?: (date: Date | Date[], dateString: string | string[]) => void;
    onConfirm?: (date: Date | Date[], dateString: string | string[]) => void;
    onPanelChange?: (date: Date | Date[], dateString: string | string[]) => void;
    onPresetClick?: (item: DatePickerPresetType, event: MouseEvent) => void;
    onClickOutSide?: (event: MouseEvent) => void;
    /** Replaces the inputs; with no focusable element of its own, its wrapper is the button that opens the panel */
    trigger?: Snippet<[DatePickerTriggerRenderProps]>;
    /** The content of a day cell */
    date?: Snippet<[DatePickerDateSnippetProps]>;
    /** The whole day cell, which then keeps only its base and active classes */
    fullDate?: Snippet<[DatePickerFullDateSnippetProps]>;
    topSlot?: Snippet;
    bottomSlot?: Snippet;
    leftSlot?: Snippet;
    rightSlot?: Snippet;
    prefix?: Snippet;
    insetLabel?: Snippet;
    clearIcon?: Snippet;
    /** How the separator between the range inputs is shown; `rangeSeparator` is the string prop that parses the text */
    rangeSeparatorNode?: Snippet;
}

/** What `trigger` receives; `onChange` sets the input text as typing would, `onEnterPress` commits it */
export interface DatePickerTriggerRenderProps {
    value: Date[];
    /** The text being typed; `null` until the user types, show the formatted `value` then */
    inputValue: string | null;
    placeholder: string | string[];
    disabled: boolean;
    size: InputSize;
    inputReadOnly: boolean;
    /** `undefined` until a range input has been focused */
    rangeInputFocus?: DatePickerRangeInput | false;
    type: DatePickerType;
    format?: string;
    multiple: boolean;
    autofocus: boolean;
    /** The declared props, without snippets, callbacks and undeclared attributes */
    componentProps: Omit<DatePickerProps, keyof HTMLAttributes<HTMLDivElement> | `on${string}` | 'trigger' | 'date' | 'fullDate' | 'topSlot' | 'bottomSlot' | 'leftSlot' | 'rightSlot' | 'prefix' | 'insetLabel' | 'clearIcon' | 'rangeSeparatorNode'>;
    onChange: (inputValue: string) => void;
    onEnterPress: (inputValue: string) => void;
    onClear: (event: MouseEvent) => void;
}
