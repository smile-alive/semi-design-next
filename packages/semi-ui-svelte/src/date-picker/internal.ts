import type { Snippet } from 'svelte';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { WeekStartNumber } from '@fibrae/semi-foundation/date-picker/_utils/get-month-table';
import type { DisabledTimeType, PresetType, Type } from '@fibrae/semi-foundation/date-picker/foundation';
import type { InsetInputChangeFoundationProps, InsetInputChangeProps, InsetInputValue, RangeInput } from '@fibrae/semi-foundation/date-picker/input-foundation';
import type { FocusRecords, MonthDayInfo } from '@fibrae/semi-foundation/date-picker/month-foundation';
import type { PanelType, YearMonthChangeType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
import type { YearAndMonth } from '@fibrae/semi-foundation/date-picker/year-and-month-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import type { InputSize, ValidateStatus } from '../input/index.js';
import type { DatePickerDateSnippetProps, DatePickerDensity, DatePickerFullDateSnippetProps, DatePickerInsetInputProps, DatePickerPresetPosition, DatePickerPresetsType, DatePickerTimePickerOpts, DatePickerValueType, DatePickerYearAndMonthOpts } from './interface.js';

export type DatePickerLocale = Locale['DatePicker'];

/** What DatePicker focuses: an Input of the trigger, or an inset input of the panel */
export interface DatePickerFocusTarget {
    focus: (options?: FocusOptions) => void;
    blur: () => void;
    getInput: () => HTMLInputElement | undefined;
}

export interface FooterProps {
    locale: DatePickerLocale;
    disabledConfirm?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export interface NavigationProps {
    locale: DatePickerLocale;
    monthText?: string;
    density?: DatePickerDensity;
    /** Whether the two panels switch together (syncSwitchMonth) */
    shouldBimonthSwitch?: boolean;
    panelType?: PanelType;
    /** id of the month button, which names the month grid */
    titleId?: string;
    onPrevYear: () => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onNextYear: () => void;
    onMonthClick: () => void;
}

export interface QuickControlProps {
    locale: DatePickerLocale;
    type: Type;
    presets?: DatePickerPresetsType;
    presetPosition?: DatePickerPresetPosition;
    insetInput?: boolean | DatePickerInsetInputProps;
    onPresetClick: (item: PresetType, event: MouseEvent) => void;
}

export interface MonthProps {
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
    date?: Snippet<[DatePickerDateSnippetProps]>;
    fullDate?: Snippet<[DatePickerFullDateSnippetProps]>;
    onDayClick: (day: MonthDayInfo) => void;
    /** No day: the pointer left the day */
    onDayHover: (day?: MonthDayInfo) => void;
    /** The keyboard moved the active day into another month or year */
    onMonthSwitch: (switchType: YearMonthChangeType) => void;
    onWeeksRowNumChange: (weeksRowNum: number) => void;
}

export interface YearAndMonthProps {
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
    dateInput?: Snippet;
    quickControls?: Snippet;
    onSelect: (yearAndMonth: YearAndMonth) => void;
    onBackToMain?: () => void;
}

export interface MonthsGridProps {
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
    insetInput: boolean | DatePickerInsetInputProps;
    presetPosition?: DatePickerPresetPosition;
    /** Whether `quickControls` renders presets, which sets the panel's x-preset-position */
    hasPresets?: boolean;
    selectedValue?: (Date | null)[];
    defaultPickerValue?: DatePickerValueType;
    timePickerOpts?: DatePickerTimePickerOpts;
    yearAndMonthOpts?: DatePickerYearAndMonthOpts;
    startYear?: number;
    endYear?: number;
    dateInput?: Snippet;
    quickControls?: Snippet;
    date?: Snippet<[DatePickerDateSnippetProps]>;
    fullDate?: Snippet<[DatePickerFullDateSnippetProps]>;
    /** Whether the range input other than the given one has been focused since the panel opened */
    hasOtherRangeInputBeenFocused?: (currentRangeInput: RangeInput) => boolean;
    onChange: (value: Date[], options?: { closePanel?: boolean; needCheckFocusRecord?: boolean; rangeInputFocus?: RangeInput | false }) => void;
    onPanelChange: (date: Date | Date[], dateString: string | string[]) => void;
    onRangeInputFocus: (rangeInputFocus: RangeInput) => void;
}

export interface InsetInputBoxProps {
    kind: 'date' | 'time';
    panel: keyof InsetInputValue;
    type: Type;
    insetInputValue: InsetInputValue;
    placeholder?: string;
    ariaLabel: string;
    disabled?: boolean;
    onChange: (options: InsetInputChangeFoundationProps) => void;
    onFocus: (event: FocusEvent) => void;
}

export interface DateInputProps {
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
    inputStyle?: string;
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
    /** Attributes of the native input(s): the field state, the combobox role and the popup state */
    controlAttrs?: Record<string, unknown>;
    prefix?: Snippet;
    insetLabel?: Snippet;
    clearIcon?: Snippet;
    rangeSeparatorNode?: Snippet;
    onChange?: (input: string, event: unknown) => void;
    /** The text of the input, or of both range inputs joined by `rangeSeparator` */
    onEnterPress?: (input: string) => void;
    /** focusin of an input, or the click on a range wrapper that focuses its input */
    onFocus?: (event: FocusEvent | MouseEvent, rangeType?: RangeInput) => void;
    onClear?: (event: MouseEvent) => void;
    onRangeClear?: (event: MouseEvent) => void;
    onRangeEndTabPress?: (event: KeyboardEvent) => void;
    onInsetInputChange?: (options: InsetInputChangeProps) => void;
    onInsetDateFocus?: (event: FocusEvent, rangeType: RangeInput) => void;
    onInsetTimeFocus?: () => void;
}
