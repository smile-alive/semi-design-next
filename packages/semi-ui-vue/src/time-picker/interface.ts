import type { StyleValue, VNode } from 'vue';
import type { TimeStamp } from '@fibrae/semi-foundation/time-picker/combox-foundation';
import type { PanelType } from '@fibrae/semi-foundation/time-picker/constants';
import type { DisabledTimeFns } from '@fibrae/semi-foundation/time-picker/foundation';
import type { InputSize, ValidateStatus } from '../input/interface';
import type { ScrollItemProps } from '../scroll-list/interface';
import type { Position } from '../tooltip/interface';

/** A time as `modelValue` accepts it: a Date, a timestamp, or a string in `format` */
export type TimePickerValue = string | number | Date;

export type TimePickerType = 'time' | 'timeRange';

/** The column options a caller may set; the panel owns `list`, `selectedIndex` and the selection */
export type TimePickerScrollItemProps = Pick<ScrollItemProps, 'cycled' | 'mode' | 'motion' | 'transform'>;

export interface TimePickerProps {
    /**
     * `null` is a controlled empty value; only `undefined` leaves the picker uncontrolled. A range side may be
     * `undefined` or `''`, which is how `update:modelValue` reports an unselected side.
     */
    modelValue?: TimePickerValue | (TimePickerValue | undefined)[] | null;
    defaultValue?: TimePickerValue | (TimePickerValue | undefined)[];
    open?: boolean;
    defaultOpen?: boolean;

    type?: TimePickerType;
    /** Defaults to `a h:mm:ss` with `use12Hours`, else `HH:mm:ss` */
    format?: string;
    use12Hours?: boolean;
    hourStep?: number;
    minuteStep?: number;
    secondStep?: number;
    disabled?: boolean;
    disabledHours?: () => number[];
    disabledMinutes?: (selectedHour: number) => number[];
    disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
    /**
     * Range only: the disabled times of the left and right panel; a callback it leaves out falls back to the prop.
     * `value` is the shown value, its unpicked side undefined.
     */
    disabledTime?: (value: (Date | undefined)[], panelType: PanelType) => DisabledTimeFns;
    hideDisabledOptions?: boolean;

    /** Defaults to the locale's placeholder of `type` */
    placeholder?: string;
    rangeSeparator?: string;
    size?: InputSize;
    borderless?: boolean;
    showClear?: boolean;
    inputReadOnly?: boolean;
    validateStatus?: ValidateStatus;
    insetLabelId?: string;
    /** Style of the Input's root element */
    inputStyle?: StyleValue;
    /** Focuses the input on mount, which opens the panel */
    autofocus?: boolean;
    /** Focuses and selects the input once mounted */
    focusOnOpen?: boolean;
    preventScroll?: boolean;

    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    popupClassName?: string;
    popupStyle?: StyleValue;
    stopPropagation?: boolean;
    /** Falls back to ConfigProvider's timeZone */
    timeZone?: string | number;
    scrollItemProps?: TimePickerScrollItemProps;
}

export interface TimePickerEmits {
    /** `undefined` (single) or `[]` (range) when cleared; the unpicked side of a range is undefined */
    'update:modelValue': [value: Date | (Date | undefined)[] | undefined];
    change: [value: Date | (Date | undefined)[] | undefined, str: string | string[]];
    'update:open': [open: boolean];
    openChange: [open: boolean];
    /** focusin on the Input's root, so focus moving between the input and its clear button does not fire it */
    focus: [event: FocusEvent];
    /** Only a mousedown outside that closes the panel blurs the picker; leaving the input does not */
    blur: [event: MouseEvent];
}

/** What `#trigger` receives; `onChange` sets the input text, as typing would */
export interface TimePickerTriggerSlotProps {
    /** The unpicked side of a range is undefined */
    value: (Date | undefined)[];
    inputValue: string;
    placeholder: string;
    disabled: boolean;
    /** A shallow copy of the props, without slots and attributes */
    componentProps: TimePickerProps;
    onChange: (inputValue: string) => void;
}

/** `index` is the panel: always 0 for `time`, 0 (start) or 1 (end) for `timeRange` */
export interface TimePickerPanelSlotProps {
    index: number;
}

export interface TimePickerSlots {
    trigger?: (props: TimePickerTriggerSlotProps) => VNode[];
    panelHeader?: (props: TimePickerPanelSlotProps) => VNode[];
    panelFooter?: (props: TimePickerPanelSlotProps) => VNode[];
    /** Range only: header and footer of panel `index`, over `#panelHeader` and `#panelFooter` while it has content */
    panel?: (props: TimePickerPanelSlotProps) => VNode[];
    prefix?: () => VNode[];
    insetLabel?: () => VNode[];
    clearIcon?: () => VNode[];
}

/** The methods on a TimePicker ref; both do nothing with a custom trigger */
export interface TimePickerHandle {
    /** Focuses the input, which opens the panel; `preventScroll` applies */
    focus(): void;
    blur(): void;
}

export interface TimePickerState {
    open: boolean;
    value: Date[];
    inputValue: string;
    invalid: boolean;
}

/** TimePicker's input; the other Input props and attributes reach the Input as they are */
export interface TimeInputProps {
    /** The input text */
    modelValue?: string;
    inputReadOnly?: boolean;
    invalid?: boolean;
    validateStatus?: ValidateStatus;
    focusOnOpen?: boolean;
    preventScroll?: boolean;
}

export interface TimeInputEmits {
    'update:modelValue': [value: string];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
}

export interface TimeInputSlots {
    prefix?: () => VNode[];
    insetLabel?: () => VNode[];
    clearIcon?: () => VNode[];
}

/** One time panel, which DatePicker renders as well */
export interface ComboboxProps {
    timeStampValue?: TimeStamp;
    format?: string;
    /** Prefix of the column class names (`${prefixCls}-list-hour` and so on); without it the columns get none */
    prefixCls?: string;
    use12Hours?: boolean;
    /** The half day the AM/PM and hour columns show while there is no value */
    defaultIsAM?: boolean;
    hideDisabledOptions?: boolean;
    hourStep?: number;
    minuteStep?: number;
    secondStep?: number;
    disabledHours?: () => number[];
    disabledMinutes?: (selectedHour: number) => number[];
    disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
    scrollItemProps?: TimePickerScrollItemProps;
}

export interface ComboboxEmits {
    change: [value: { timeStampValue: number }];
}

export interface ComboboxSlots {
    panelHeader?: () => VNode[];
    panelFooter?: () => VNode[];
}

/** Called by DatePicker to re-centre the selected items, e.g. after the panel resizes */
export interface ComboboxHandle {
    reselect(): void;
}
