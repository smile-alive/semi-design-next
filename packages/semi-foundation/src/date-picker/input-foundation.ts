import { format as formatFn } from 'date-fns';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { Locale } from '../locale/interface';
import isObject from '../utils/is-object';
import { isSecondaryPress } from '../utils/pointer';
import { isValidDate } from './_utils';
import { formatDateValues } from './_utils/formatter';
import { getDefaultFormatTokenByType } from './_utils/get-default-format-token';
import getDefaultPickerDate from './_utils/get-default-picker-date';
import getInsetInputFormatToken from './_utils/get-inset-input-format-token';
import getInsetInputValueFromInsetInputStr from './_utils/get-inset-input-value-from-inset-input-str';
import { compatibleParse } from './_utils/parser';
import { isSplitRangeInputs } from './_utils/picker-type';
import { strings } from './constants';
import type { BaseValueType, ValidateStatus, ValueType } from './foundation';

const KEY_CODE_ENTER = 'Enter';
const KEY_CODE_TAB = 'Tab';

export type Type = 'date' | 'dateRange' | 'year' | 'month' | 'dateTime' | 'dateTimeRange' | 'monthRange';
/** The range input, start or end, that a focus or a value belongs to */
export type RangeInput = 'rangeStart' | 'rangeEnd';
export type PanelType = 'left' | 'right';

export interface DateInputEventHandlerProps {
    onClick?: (e: any) => void;
    onChange?: (value: string, e: any) => void;
    onEnterPress?: (e: any) => void;
    onBlur?: (e: any) => void;
    onFocus?: (e: any, rangeType: RangeInput) => void;
    onClear?: (e: any) => void;
    onRangeClear?: (e: any) => void;
    onRangeEndTabPress?: (e: any) => void;
    onInsetInputChange?: (options: InsetInputChangeProps) => void;
}

export interface DateInputElementProps {
    borderless?: boolean;
    insetLabel?: any;
    prefix?: any;
}

export interface InsetInputProps {
    placeholder?: {
        dateStart?: string;
        dateEnd?: string;
        timeStart?: string;
        timeEnd?: string;
    };
}

export interface DateInputFoundationProps extends DateInputElementProps, DateInputEventHandlerProps {
    value?: Date[];
    dateFnsLocale?: any;
    disabled?: boolean;
    type?: Type;
    showClear?: boolean;
    format?: string;
    inputStyle?: Record<string, any>;
    inputReadOnly?: boolean;
    validateStatus?: ValidateStatus;
    prefixCls?: string;
    rangeSeparator?: string;
    /**
     * Only for UI render. Keep `semi-foundation` framework-agnostic (no React types).
     * `semi-ui-react` layer should declare this as `React.ReactNode`.
     */
    rangeSeparatorNode?: any;
    panelType?: PanelType;
    insetInput?: boolean | InsetInputProps;
    insetInputValue?: InsetInputValue;
    density?: (typeof strings.DENSITY_SET)[number];
    defaultPickerValue?: ValueType;
}

export interface InsetInputValue {
    monthLeft: {
        dateInput: string;
        timeInput: string;
    };
    monthRight: {
        dateInput: string;
        timeInput: string;
    };
}

export interface InsetInputChangeFoundationProps {
    value: string;
    insetInputValue: InsetInputValue;
    event: any;
    /** which inset input changed: the date or time box of the left or right panel */
    panel: keyof InsetInputValue;
    field: keyof InsetInputValue['monthLeft'];
}

export interface InsetInputChangeProps {
    insetInputStr: string;
    format: string;
    insetInputValue: InsetInputValue;
}

export interface DateInputAdapter extends DefaultAdapter<DateInputFoundationProps, Record<string, never>> {
    notifyChange: DateInputFoundationProps['onChange'];
    notifyInsetInputChange: DateInputFoundationProps['onInsetInputChange'];
    notifyEnter: DateInputFoundationProps['onEnterPress'];
    notifyClear: DateInputFoundationProps['onClear'];
    notifyRangeInputClear: DateInputFoundationProps['onRangeClear'];
    notifyRangeInputFocus: DateInputFoundationProps['onFocus'];
    notifyTabPress: DateInputFoundationProps['onRangeEndTabPress'];
}

type InputProps = Pick<DateInputFoundationProps, 'type' | 'format' | 'rangeSeparator' | 'dateFnsLocale'>;

export default class InputFoundation extends BaseFoundation<DateInputAdapter, DateInputFoundationProps, Record<string, never>> {
    static #concatInsetDateAndTime({ date, time }: { date: string; time: string }) {
        return `${date} ${time}`;
    }

    static #concatInsetDateRange(props: InputProps, { rangeStart, rangeEnd }: { rangeStart: string; rangeEnd: string }) {
        return `${rangeStart}${props.rangeSeparator}${rangeEnd}`;
    }

    #autoFillTimeToInsetInputValue({ panel, field, insetInputValue, format }: { insetInputValue: InsetInputValue; format: string } & Pick<InsetInputChangeFoundationProps, 'panel' | 'field'>) {
        const { type, defaultPickerValue, dateFnsLocale } = this.adapter.getProps();
        const { dateInput, timeInput } = insetInputValue[panel];
        if (!type.includes('Time') || field !== 'dateInput' || timeInput) {
            return insetInputValue;
        }

        const dateFormatToken = format.split(' ')[0] ?? strings.FORMAT_FULL_DATE;
        const timeFormatToken = format.split(' ')[1] ?? strings.FORMAT_TIME_PICKER;
        if (dateInput.length !== dateFormatToken.length || !isValidDate(compatibleParse(dateInput, dateFormatToken))) {
            return insetInputValue;
        }
        const { nowDate, nextDate } = getDefaultPickerDate({ defaultPickerValue, format, dateFnsLocale });
        const panelDate = panel === 'monthRight' ? nextDate : nowDate;
        return {
            ...insetInputValue,
            [panel]: { dateInput, timeInput: formatFn(panelDate, timeFormatToken) },
        };
    }

    /** The text the trigger input shows for `value` */
    static formatShowText({ type, dateFnsLocale, format, rangeSeparator }: InputProps, value: BaseValueType[], customFormat?: string) {
        const formatToken = customFormat || format || getDefaultFormatTokenByType(type);
        switch (type) {
            case 'date':
            case 'dateTime':
            case 'month':
            case 'year':
                return formatDateValues(value, formatToken, undefined, dateFnsLocale);
            case 'dateRange':
            case 'dateTimeRange':
            case 'monthRange':
                return formatDateValues(value, formatToken, { groupSize: 2, groupInnerSeparator: rangeSeparator }, dateFnsLocale);
            default:
                return '';
        }
    }

    /** The trigger text: the text being typed, else `value` formatted */
    static getShowText(props: InputProps & { inputValue?: string | null; value?: BaseValueType[] }) {
        if (props.inputValue != null) {
            return props.inputValue;
        }
        return props.value?.length ? InputFoundation.formatShowText(props, props.value) : '';
    }

    /** `showClearIgnoreDisabled` keeps the button on a disabled trigger, as with insetInput */
    static getRangeClearVisible({ start, end, showClear, disabled, showClearIgnoreDisabled }: { start: string; end: string; showClear?: boolean; disabled?: boolean; showClearIgnoreDisabled?: boolean }) {
        return Boolean(start || end) && Boolean(showClear) && !(disabled && !showClearIgnoreDisabled);
    }

    /** The accessible names of the inset inputs; their placeholder is a format shared by both boxes, so the names come from the locale */
    static getInsetNames(locale: Pick<Locale['DatePicker'], 'placeholder' | 'chooseDate' | 'selectTime'>, type: Type) {
        const typeName = (locale.placeholder as Record<string, string | [string, string] | undefined>)[type] ?? locale.chooseDate;
        const [start, end] = Array.isArray(typeName) ? typeName : [typeName, typeName];
        const timeName = (dateName: string) => (isSplitRangeInputs(type) ? `${dateName} ${locale.selectTime}` : locale.selectTime);
        return { start, end, startTime: timeName(start), endTime: timeName(end) };
    }

    // The user's format is used only when it conforms to formatReg; otherwise the default format is the placeholder
    static getInsetInputPlaceholder({ type, format, rangeSeparator }: InputProps) {
        const insetInputFormat = getInsetInputFormatToken({ type, format });
        let datePlaceholder, timePlaceholder;

        switch (type) {
            case 'date':
            case 'month':
            case 'year':
            case 'dateRange':
                datePlaceholder = insetInputFormat;
                break;
            case 'dateTime':
            case 'dateTimeRange':
                [datePlaceholder, timePlaceholder] = insetInputFormat.split(' ');
                break;
            case 'monthRange':
                datePlaceholder = insetInputFormat + rangeSeparator + insetInputFormat;
                break;
        }

        return {
            datePlaceholder,
            timePlaceholder,
        };
    }

    static getInsetInputValue(props: InputProps, { value, insetInputValue }: { value: BaseValueType[]; insetInputValue: InsetInputValue }) {
        const { type, rangeSeparator, format } = props;

        let inputValueStr = '';
        if (isObject(insetInputValue)) {
            inputValueStr = InputFoundation.concatInsetInputValue(props, { insetInputValue });
        } else {
            const insetInputFormat = getInsetInputFormatToken({ format, type });
            inputValueStr = InputFoundation.formatShowText(props, value, insetInputFormat);
        }

        return getInsetInputValueFromInsetInputStr({
            inputValue: inputValueStr,
            type,
            rangeSeparator,
        });
    }

    static concatInsetInputValue(props: InputProps, { insetInputValue }: { insetInputValue: InsetInputValue }) {
        switch (props.type) {
            case 'date':
            case 'month':
            case 'year':
            case 'monthRange':
                return insetInputValue.monthLeft.dateInput;
            case 'dateRange':
                return InputFoundation.#concatInsetDateRange(props, {
                    rangeStart: insetInputValue.monthLeft.dateInput,
                    rangeEnd: insetInputValue.monthRight.dateInput,
                });
            case 'dateTime':
                return InputFoundation.#concatInsetDateAndTime({
                    date: insetInputValue.monthLeft.dateInput,
                    time: insetInputValue.monthLeft.timeInput,
                });
            case 'dateTimeRange':
                return InputFoundation.#concatInsetDateRange(props, {
                    rangeStart: InputFoundation.#concatInsetDateAndTime({
                        date: insetInputValue.monthLeft.dateInput,
                        time: insetInputValue.monthLeft.timeInput,
                    }),
                    rangeEnd: InputFoundation.#concatInsetDateAndTime({
                        date: insetInputValue.monthRight.dateInput,
                        time: insetInputValue.monthRight.timeInput,
                    }),
                });
            default:
                return '';
        }
    }

    handleChange = (value: string, e: unknown) => {
        this.adapter.notifyChange(value, e);
    };

    handleInputComplete = (e: Pick<KeyboardEvent, 'key' | 'target'>) => {
        if (e.key === KEY_CODE_ENTER && e.target instanceof HTMLInputElement) {
            this.adapter.notifyEnter(e.target.value);
        }
    };

    handleInputClear = (e: unknown) => {
        this.adapter.notifyClear(e);
    };

    handleRangeInputClear(e: Pick<Event, 'stopPropagation'>) {
        // Keeps the clear click from counting as a click outside
        e.stopPropagation();
        this.adapter.notifyRangeInputClear(e);
    }

    // The pointer clears on mousedown; Enter and Space fire a click with detail 0
    handleRangeInputClearClick = (e: Pick<MouseEvent, 'detail' | 'stopPropagation'>) => {
        if (e.detail === 0) {
            this.handleRangeInputClear(e);
        }
    };

    // The other buttons only keep the focus where it is
    handleRangeInputClearMouseDown = (e: Pick<MouseEvent, 'button' | 'preventDefault' | 'stopPropagation'>) => {
        if (isSecondaryPress(e)) {
            e.preventDefault();
        } else {
            this.handleRangeInputClear(e);
        }
    };

    handleRangeInputEnterPress = (e: Pick<KeyboardEvent, 'key'>, rangeInputValue: string) => {
        if (e.key === KEY_CODE_ENTER) {
            this.adapter.notifyEnter(rangeInputValue);
        }
    };

    handleRangeInputEndKeyPress = (e: Pick<KeyboardEvent, 'key'>) => {
        if (e.key === KEY_CODE_TAB) {
            this.adapter.notifyTabPress(e);
        }
    };

    handleRangeInputFocus = (e: unknown, rangeType: RangeInput) => {
        this.adapter.notifyRangeInputFocus(e, rangeType);
    };

    handleInsetInputChange = ({ value, panel, field, insetInputValue }: InsetInputChangeFoundationProps) => {
        const props = this.adapter.getProps();
        const { format, type, rangeSeparator } = props;
        const insetFormatToken = getInsetInputFormatToken({ type, format });
        const newInsetInputValue = { ...insetInputValue, [panel]: { ...insetInputValue[panel], [field]: value } };
        const insetInputStr = InputFoundation.concatInsetInputValue(props, { insetInputValue: newInsetInputValue });
        const parsedInsetInputValueFromInputStr = getInsetInputValueFromInsetInputStr({
            inputValue: insetInputStr,
            type,
            rangeSeparator,
        });
        const filledTimeInsetInputValue = this.#autoFillTimeToInsetInputValue({
            insetInputValue: parsedInsetInputValueFromInputStr,
            panel,
            field,
            format: insetFormatToken,
        });
        const finalInsetInputStr = InputFoundation.concatInsetInputValue(props, {
            insetInputValue: filledTimeInsetInputValue,
        });
        this.adapter.notifyInsetInputChange({
            insetInputValue: filledTimeInsetInputValue,
            format: insetFormatToken,
            insetInputStr: finalInsetInputStr,
        });
    };
}
