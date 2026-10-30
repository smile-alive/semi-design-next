import type { StyleValue, VNode } from 'vue';
import type { WeekStartNumber } from '@fibrae/semi-foundation/date-picker/_utils/get-month-table';
import type { BaseValueType, DateOffsetType, DayStatusType, DensityType, DisabledDateOptions, DisabledDateType, DisabledTimeType, PresetPosition, PresetType, PresetsType, Type, ValueType } from '@fibrae/semi-foundation/date-picker/foundation';
import type { InsetInputProps, RangeInput } from '@fibrae/semi-foundation/date-picker/input-foundation';
import type { InputSize, ValidateStatus } from '../input/interface';
import type { ScrollItemProps } from '../scroll-list/interface';
import type { ComboboxProps } from '../time-picker/interface';
import type { Position } from '../tooltip/interface';

export type DatePickerBaseValueType = BaseValueType;
/** A date as `modelValue` accepts it: a Date, a timestamp or a string in `format`; an array for range and multiple */
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

export interface DatePickerProps {
    /** `null` is a controlled empty value; only `undefined` leaves the picker uncontrolled */
    modelValue?: DatePickerValueType | null;
    defaultValue?: DatePickerValueType;
    open?: boolean;
    defaultOpen?: boolean;
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
    /** Separates the range in the input text and parses it; `#rangeSeparator` only changes how it is shown */
    rangeSeparator?: string;
    size?: InputSize;
    density?: DatePickerDensity;
    borderless?: boolean;
    showClear?: boolean;
    inputReadOnly?: boolean;
    /** Style of the Input's root element */
    inputStyle?: StyleValue;
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
    dropdownStyle?: StyleValue;
}

export interface DatePickerEmits {
    /** `undefined` (single) or `[]` (range and multiple) when cleared */
    'update:modelValue': [value: Date | Date[] | undefined];
    change: [date: Date | Date[] | undefined, dateString: string | string[]];
    'update:open': [open: boolean];
    openChange: [open: boolean];
    /**
     * focusin of an input, or the click or key press on the trigger that focused the range start; `rangeType` is set
     * for the range inputs only, and moving between them does not fire it again
     */
    focus: [event: FocusEvent | MouseEvent | KeyboardEvent, rangeType?: DatePickerRangeInput];
    /** Fires when the panel closes: with the mousedown outside that closed it, otherwise without an event */
    blur: [event?: MouseEvent];
    clear: [event: MouseEvent];
    cancel: [date: Date | Date[], dateString: string | string[]];
    confirm: [date: Date | Date[], dateString: string | string[]];
    panelChange: [date: Date | Date[], dateString: string | string[]];
    presetClick: [item: DatePickerPresetType, event: MouseEvent];
    clickOutSide: [event: MouseEvent];
}

/** What `#trigger` receives; `onChange` sets the input text as typing would, `onEnterPress` commits it */
export interface DatePickerTriggerSlotProps {
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
    /** A shallow copy of the props, without slots and attributes */
    componentProps: DatePickerProps;
    onChange: (inputValue: string) => void;
    onEnterPress: (inputValue: string) => void;
    onClear: (event: MouseEvent) => void;
}

export interface DatePickerDateSlotProps {
    dayNumber: number;
    /** yyyy-MM-dd */
    fullDate: string;
}

export interface DatePickerFullDateSlotProps extends DatePickerDateSlotProps {
    dayStatus: DatePickerDayStatusType;
}

export interface DatePickerSlots {
    trigger?: (props: DatePickerTriggerSlotProps) => VNode[];
    /** The content of a day cell */
    date?: (props: DatePickerDateSlotProps) => VNode[];
    /** The whole day cell, which then keeps only its base and active classes */
    fullDate?: (props: DatePickerFullDateSlotProps) => VNode[];
    topSlot?: () => VNode[];
    bottomSlot?: () => VNode[];
    leftSlot?: () => VNode[];
    rightSlot?: () => VNode[];
    prefix?: () => VNode[];
    insetLabel?: () => VNode[];
    clearIcon?: () => VNode[];
    /** How the separator between the range inputs is shown */
    rangeSeparator?: () => VNode[];
}

/** The methods on a DatePicker ref */
export interface DatePickerHandle {
    /** Opens the panel; a controlled `open` wins */
    open(): void;
    /** Closes the panel; a controlled `open` wins */
    close(): void;
    /**
     * Focuses the input; a range focuses its start input unless `rangeEnd` is given. With `insetInput` and the panel
     * open the trigger is disabled, so the focus goes to the input in the panel. `preventScroll` applies
     */
    focus(focusType?: DatePickerRangeInput): void;
    blur(): void;
}
