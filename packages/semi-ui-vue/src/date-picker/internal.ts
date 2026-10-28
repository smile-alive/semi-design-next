import type { StyleValue, VNode } from 'vue';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { WeekStartNumber } from '@fibrae/semi-foundation/date-picker/_utils/get-month-table';
import type { DisabledTimeType, PresetType, Type } from '@fibrae/semi-foundation/date-picker/foundation';
import type { InsetInputChangeFoundationProps, InsetInputChangeProps, InsetInputValue, RangeInput } from '@fibrae/semi-foundation/date-picker/input-foundation';
import type { FocusRecords, MonthDayInfo } from '@fibrae/semi-foundation/date-picker/month-foundation';
import type { PanelType, YearMonthChangeType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
import type { YearAndMonth } from '@fibrae/semi-foundation/date-picker/year-and-month-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import type { InputHandle, InputSize, ValidateStatus } from '../input/interface';
import type { DatePickerDateSlotProps, DatePickerDensity, DatePickerFullDateSlotProps, DatePickerInsetInputProps, DatePickerPresetPosition, DatePickerPresetsType, DatePickerTimePickerOpts, DatePickerValueType, DatePickerYearAndMonthOpts } from './interface';

type DatePickerLocale = Locale['DatePicker'];

/** What DatePicker focuses: an Input of the trigger, or an inset input of the panel */
export type DatePickerFocusTarget = Pick<InputHandle, 'focus' | 'blur' | 'input'>;

export interface DatePickerFooterProps {
    locale: DatePickerLocale;
    disabledConfirm?: boolean;
}

export interface DatePickerFooterEmits {
    cancel: [];
    confirm: [];
}

export interface DatePickerNavigationProps {
    locale: DatePickerLocale;
    monthText?: string;
    density?: DatePickerDensity;
    /** Whether the two panels switch together (syncSwitchMonth) */
    shouldBimonthSwitch?: boolean;
    panelType?: PanelType;
    /** id of the month button, which names the month grid */
    titleId?: string;
}

export interface DatePickerNavigationEmits {
    prevYear: [];
    prevMonth: [];
    nextMonth: [];
    nextYear: [];
    monthClick: [event: MouseEvent];
}

export interface DatePickerQuickControlProps {
    locale: DatePickerLocale;
    type: Type;
    presets?: DatePickerPresetsType;
    presetPosition?: DatePickerPresetPosition;
    insetInput?: boolean | DatePickerInsetInputProps;
}

export interface DatePickerQuickControlEmits {
    presetClick: [item: PresetType, event: MouseEvent];
}

export interface DatePickerMonthProps {
    month: Date;
    weekStartsOn: WeekStartNumber;
    locale: DatePickerLocale;
    multiple: boolean;
    selected: Set<string>;
    rangeStart: string;
    rangeEnd: string;
    offsetRangeStart: string;
    offsetRangeEnd: string;
    disabledDate: (day: Date, options?: { rangeStart: string; rangeEnd: string }) => boolean;
    hoverDay: string;
    rangeInputFocus: string | boolean;
    focusRecords: FocusRecords;
    /** id of the element naming the grid */
    labelledby?: string;
}

export interface DatePickerMonthEmits {
    dayClick: [day: MonthDayInfo];
    /** No day: the pointer left the day */
    dayHover: [day?: MonthDayInfo];
    /** The keyboard moved the active day into another month or year */
    monthSwitch: [switchType: YearMonthChangeType];
    weeksRowNumChange: [weeksRowNum: number];
}

export interface DatePickerMonthSlots {
    date?: (props: DatePickerDateSlotProps) => VNode[];
    fullDate?: (props: DatePickerFullDateSlotProps) => VNode[];
}

export interface DatePickerYearAndMonthProps {
    /** 0 stands for the current year, or the year after it for the right panel */
    currentYear: { left: number; right: number };
    /** 0 stands for the current month, or the month after it for the right panel */
    currentMonth: { left: number; right: number };
    locale: DatePickerLocale;
    monthCycled?: boolean;
    yearCycled?: boolean;
    noBackBtn?: boolean;
    disabledDate?: (date: Date) => boolean;
    density?: DatePickerDensity;
    presetPosition?: DatePickerPresetPosition;
    type?: Type;
    yearAndMonthOpts?: DatePickerYearAndMonthOpts;
    startYear?: number;
    endYear?: number;
}

export interface DatePickerYearAndMonthEmits {
    select: [yearAndMonth: YearAndMonth];
    backToMain: [];
}

export interface DatePickerYearAndMonthSlots {
    dateInput?: () => VNode[];
    quickControls?: () => VNode[];
}

/** Called by MonthsGrid to re-centre the year and month columns, e.g. after the panel resizes */
export interface DatePickerYearAndMonthHandle {
    reselect(): void;
}

export interface DatePickerMonthsGridProps {
    type: Type;
    locale: DatePickerLocale;
    dateFnsLocale?: DateFnsLocale;
    multiple?: boolean;
    max?: number;
    weekStartsOn?: WeekStartNumber;
    disabledDate: (date: Date, options?: Record<string, unknown>) => boolean;
    disabledTime: (date: Date | Date[], panelType: PanelType) => ReturnType<DisabledTimeType>;
    disabledTimePicker?: boolean;
    hideDisabledOptions?: boolean;
    isControlledComponent?: boolean;
    rangeInputFocus?: RangeInput | false;
    format?: string;
    startDateOffset?: (selectedDate: Date) => Date;
    endDateOffset?: (selectedDate: Date) => Date;
    autoSwitchDate?: boolean;
    density?: DatePickerDensity;
    timeZone?: string | number;
    syncSwitchMonth?: boolean;
    focusRecords?: FocusRecords;
    insetInput?: boolean | DatePickerInsetInputProps;
    presetPosition?: DatePickerPresetPosition;
    /** Whether `#quickControls` renders presets, which sets the panel's x-preset-position */
    hasPresets?: boolean;
    selectedValue?: (Date | null)[];
    defaultPickerValue?: DatePickerValueType;
    timePickerOpts?: DatePickerTimePickerOpts;
    yearAndMonthOpts?: DatePickerYearAndMonthOpts;
    startYear?: number;
    endYear?: number;
    /** Whether the range input other than the given one has been focused since the panel opened */
    hasOtherRangeInputBeenFocused?: (currentRangeInput: RangeInput) => boolean;
}

export interface DatePickerMonthsGridEmits {
    change: [value: Date[], options?: { closePanel?: boolean; needCheckFocusRecord?: boolean; rangeInputFocus?: RangeInput | false }];
    panelChange: [date: Date | Date[], dateString: string | string[]];
    rangeInputFocus: [rangeInputFocus: RangeInput];
}

export interface DatePickerMonthsGridSlots {
    dateInput?: () => VNode[];
    quickControls?: () => VNode[];
    date?: (props: DatePickerDateSlotProps) => VNode[];
    fullDate?: (props: DatePickerFullDateSlotProps) => VNode[];
}

/** Called by DatePicker when an inset input of the panel gets focus */
export interface DatePickerMonthsGridHandle {
    showDatePanel(panelType: PanelType): void;
    showTimePicker(panelType: PanelType): void;
}

export interface DatePickerInsetBoxProps {
    kind: 'date' | 'time';
    panel: keyof InsetInputValue;
    type: Type;
    insetInputValue: InsetInputValue;
    placeholder?: string;
    ariaLabel: string;
    disabled?: boolean;
}

export interface DatePickerInsetBoxEmits {
    change: [options: InsetInputChangeFoundationProps];
    focus: [event: FocusEvent];
}

export interface DatePickerDateInputProps {
    type: Type;
    value?: Date[];
    /** Text shown instead of the one formatted from `value` */
    inputValue?: string | null;
    placeholder?: string | string[];
    format?: string;
    dateFnsLocale?: DateFnsLocale;
    rangeSeparator: string;
    disabled?: boolean;
    showClear?: boolean;
    showClearIgnoreDisabled?: boolean;
    inputReadOnly?: boolean;
    inputStyle?: StyleValue;
    insetLabelId?: string;
    validateStatus?: ValidateStatus;
    borderless?: boolean;
    size?: InputSize;
    autofocus?: boolean;
    rangeInputFocus?: RangeInput | false;
    insetInput?: boolean | DatePickerInsetInputProps;
    insetInputValue?: InsetInputValue | null;
    defaultPickerValue?: DatePickerValueType;
    density?: DatePickerDensity;
}

export interface DatePickerDateInputEmits {
    change: [input: string, event: unknown];
    /** The text of the input, or of both range inputs joined by `rangeSeparator` */
    enterPress: [input: string];
    /** focusin of an input, or the click on a range wrapper that focuses its input */
    focus: [event: FocusEvent | MouseEvent, rangeType?: RangeInput];
    clear: [event: MouseEvent];
    rangeClear: [event: MouseEvent];
    rangeEndTabPress: [event: KeyboardEvent];
    insetInputChange: [options: InsetInputChangeProps];
    insetDateFocus: [event: FocusEvent, rangeType: RangeInput];
    insetTimeFocus: [];
}

export interface DatePickerDateInputSlots {
    prefix?: () => VNode[];
    insetLabel?: () => VNode[];
    clearIcon?: () => VNode[];
    rangeSeparator?: () => VNode[];
}

export interface DatePickerDateInputHandle {
    /** The single input of the trigger */
    readonly input: DatePickerFocusTarget | null;
    /** The start input of a range trigger, or the first inset date input */
    readonly rangeStart: DatePickerFocusTarget | null;
    readonly rangeEnd: DatePickerFocusTarget | null;
}
