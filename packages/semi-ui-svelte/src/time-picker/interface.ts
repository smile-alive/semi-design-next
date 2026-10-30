import type { Snippet } from 'svelte';
import type { ClassValue, HTMLInputAttributes } from 'svelte/elements';
import type { TimeStamp } from '@fibrae/semi-foundation/time-picker/combox-foundation';
import type { PanelType } from '@fibrae/semi-foundation/time-picker/constants';
import type { DisabledTimeFns } from '@fibrae/semi-foundation/time-picker/foundation';
import type { InputProps, InputSize, ValidateStatus } from '../input/index.js';
import type { ScrollItemProps } from '../scroll-list/index.js';
import type { Position } from '../tooltip/index.js';

/** A time as `value` accepts it: a Date, a timestamp, a string in `format`, or an unpicked range side */
export type TimePickerBaseValueType = string | number | Date | undefined;

export type TimePickerType = 'time' | 'timeRange';

/** The column options a caller may set; the panel owns `list`, `selectedIndex` and the selection */
export type TimePickerScrollItemProps = Pick<ScrollItemProps, 'cycled' | 'mode' | 'motion' | 'transform'>;

/** `index` is the panel: always 0 for `time`, 0 (start) or 1 (end) for `timeRange` */
export interface TimePickerPanelSnippetProps {
    index: number;
}

// Declared props replace the native ones of the same name; the lowercase listeners the Input handles itself are
// reached through its camelCase callbacks. Every other attribute reaches the native input; class and style the root.
type NativeInputKeys = 'children' | 'value' | 'size' | 'type' | 'placeholder' | 'prefix' | 'disabled' | 'autofocus' | 'onchange' | 'oninput' | 'onfocus' | 'onblur' | 'onkeydown' | 'onkeyup' | 'oncompositionstart' | 'oncompositionupdate' | 'oncompositionend';

export interface TimePickerProps extends Omit<HTMLInputAttributes, NativeInputKeys>, Pick<InputProps, 'onKeyDown' | 'onKeyUp' | 'onEnterPress'> {
    /**
     * Bindable. `null` is a controlled empty value; only `undefined` leaves the picker uncontrolled. A range side may
     * be `undefined` or `''`, which is how `onChange` reports an unselected side.
     */
    value?: TimePickerBaseValueType | TimePickerBaseValueType[] | null;
    /** Bindable */
    open?: boolean;
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
    inputStyle?: string;
    /** Focuses the input on mount, which opens the panel */
    autofocus?: boolean;
    /** Focuses and selects the input once mounted */
    focusOnOpen?: boolean;
    preventScroll?: boolean;
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    popupClassName?: ClassValue;
    popupStyle?: string;
    stopPropagation?: boolean;
    /** Falls back to ConfigProvider's timeZone */
    timeZone?: string | number;
    scrollItemProps?: TimePickerScrollItemProps;
    /** `undefined` (single) or `[]` (range) when cleared; the unpicked side of a range is undefined */
    onChange?: (value: Date | (Date | undefined)[] | undefined, str: string | string[]) => void;
    onOpenChange?: (open: boolean) => void;
    /** focusin on the Input's root, so focus moving between the input and its clear button does not fire it */
    onFocus?: (event: FocusEvent) => void;
    /** Only a mousedown outside that closes the panel blurs the picker; leaving the input does not */
    onBlur?: (event: MouseEvent) => void;
    /** Replaces the input; with no focusable element of its own, its wrapper is the button that opens the panel */
    trigger?: Snippet<[TimePickerTriggerRenderProps]>;
    panelHeader?: Snippet<[TimePickerPanelSnippetProps]>;
    panelFooter?: Snippet<[TimePickerPanelSnippetProps]>;
    /** Range only: header and footer of both panels, over `panelHeader` and `panelFooter` */
    panel?: Snippet<[TimePickerPanelSnippetProps]>;
    prefix?: Snippet;
    insetLabel?: Snippet;
    clearIcon?: Snippet;
}

/** What `trigger` receives; `onChange` sets the input text, as typing would */
export interface TimePickerTriggerRenderProps {
    /** The unpicked side of a range is undefined */
    value: (Date | undefined)[];
    inputValue: string;
    placeholder: string;
    disabled: boolean;
    /** The declared props, without snippets and undeclared attributes */
    componentProps: Omit<TimePickerProps, 'trigger' | 'panelHeader' | 'panelFooter' | 'panel' | 'prefix' | 'insetLabel' | 'clearIcon'>;
    onChange: (inputValue: string) => void;
}

export interface TimePickerState {
    open: boolean;
    value: Date[];
    inputValue: string;
    invalid: boolean;
}

/** TimePicker's input; the other Input props reach the Input as they are */
export interface TimeInputProps extends Omit<InputProps, 'value' | 'onChange' | 'onFocus' | 'onBlur'> {
    /** The input text */
    value?: string;
    inputReadOnly?: boolean;
    invalid?: boolean;
    focusOnOpen?: boolean;
    onChange?: (value: string) => void;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
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
    panelHeader?: Snippet | string;
    panelFooter?: Snippet | string;
    onChange?: (value: { timeStampValue: number }) => void;
}

/** Called by DatePicker to re-centre the selected items, e.g. after the panel resizes */
export interface ComboboxHandle {
    reselect(): void;
}
