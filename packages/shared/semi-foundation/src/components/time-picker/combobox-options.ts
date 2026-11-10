import { isValidDate } from '../date-picker/_utils/index';
import { strings } from './constants';

export type TimeStamp = Date | string | number;
export type ColumnType = 'ampm' | 'hour' | 'minute' | 'second';

export interface ComboboxBaseProps {
    timeStampValue?: TimeStamp;
    format?: string;
    use12Hours?: boolean;
    /** The half day shown while there is no value; defaults to AM */
    defaultIsAM?: boolean;
    hideDisabledOptions?: boolean;
    hourStep?: number;
    minuteStep?: number;
    secondStep?: number;
    disabledHours?: () => number[];
    disabledMinutes?: (selectedHour: number) => number[];
    disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
}

export function formatOption(option: number, disabledOptions: number[]) {
    return {
        value: String(option).padStart(2, '0'),
        disabled: Boolean(disabledOptions?.includes(option)),
    };
}

function generateOptions(length: number, disabledOptions: number[], hideDisabledOptions: boolean, step: number | undefined, stepName: string) {
    // A step of 0 or less never leaves the loop below, and a fractional one lists values no column can select
    if (step !== undefined && !(Number.isInteger(step) && step > 0)) {
        throw new RangeError(`${stepName} must be a positive integer, got ${step}`);
    }
    const arr = [];
    for (let value = 0; value < length; value += step ?? 1) {
        if (!hideDisabledOptions || !disabledOptions?.includes(value)) {
            arr.push(value);
        }
    }
    return arr;
}

function toColumn(options: number[], disabledOptions: number[], selected: number) {
    return {
        list: options.map((option) => formatOption(option, disabledOptions)),
        selectedIndex: options.indexOf(selected),
    };
}

/**
 * `disabledHours()`, mapped onto the 12-hour column of the half day `isAM` names when `use12Hours`; the hours of
 * the other half day drop out
 */
function getDisabledHours({ use12Hours, disabledHours, isAM }: Pick<ComboboxBaseProps, 'use12Hours' | 'disabledHours'> & { isAM?: boolean }) {
    const disabledOptions = disabledHours && disabledHours();

    if (use12Hours && Array.isArray(disabledOptions)) {
        return disabledOptions.filter((h) => h < 12 === Boolean(isAM)).map((h) => h % 12 || 12);
    }
    return disabledOptions;
}

function getDisplayDateFromTimeStamp(timeStamp: TimeStamp, defaultIsPM = false) {
    if (!hasValue(timeStamp)) {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), defaultIsPM ? 12 : 0);
    }
    return new Date(timeStamp);
}

/** A timestamp of 0 is a value; only nothing and '' are not */
export function hasValue(timeStamp: unknown) {
    return timeStamp != null && timeStamp !== '' && isValidDate(new Date(timeStamp as Date));
}

export function isAM(timeStamp: TimeStamp, defaultIsAM = true) {
    return hasValue(timeStamp) ? getDisplayDateFromTimeStamp(timeStamp).getHours() < 12 : defaultIsAM;
}

export function getColumns(format: string) {
    return {
        showHour: /HH|hh|H|h/.test(format),
        showMinute: format.includes('mm'),
        showSecond: format.includes('ss'),
    };
}

/**
 * Every column reads the shown time (midnight, or noon in a PM panel, while there is no value), the time a picked
 * item is applied to.
 */
export function getOptions(props: ComboboxBaseProps) {
    const { timeStampValue, use12Hours, hourStep, disabledMinutes, disabledSeconds, hideDisabledOptions, minuteStep, secondStep } = props;

    const format = typeof props.format === 'string' ? props.format : strings.DEFAULT_FORMAT;
    const am = isAM(timeStampValue, props.defaultIsAM);
    const dateTime = getDisplayDateFromTimeStamp(timeStampValue, use12Hours && !am);
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();

    const disabledHourOptions = getDisabledHours({ ...props, isAM: am });
    const disabledMinuteOptions = disabledMinutes?.(hours);
    const disabledSecondOptions = disabledSeconds?.(hours, minutes);
    const hourOptions = use12Hours
        ? generateOptions(12, undefined, false, hourStep, 'hourStep')
              .map((hour) => hour || 12)
              .filter((hour) => !hideDisabledOptions || !disabledHourOptions?.includes(hour))
        : generateOptions(24, disabledHourOptions, hideDisabledOptions, hourStep, 'hourStep');
    const minuteOptions = generateOptions(60, disabledMinuteOptions, hideDisabledOptions, minuteStep, 'minuteStep');
    const secondOptions = generateOptions(60, disabledSecondOptions, hideDisabledOptions, secondStep, 'secondStep');

    return {
        ...getColumns(format),
        isAM: am,
        // the labels come from the locale, keyed by value
        ampm: { list: [{ value: 'AM' as const }, { value: 'PM' as const }], selectedIndex: am ? 0 : 1 },
        hour: toColumn(hourOptions, disabledHourOptions, use12Hours ? hours % 12 || 12 : hours),
        minute: toColumn(minuteOptions, disabledMinuteOptions, minutes),
        second: toColumn(secondOptions, disabledSecondOptions, dateTime.getSeconds()),
    };
}

/** A 12-hour hour keeps the half day `isAMValue` names; AM/PM moves the time by 12 hours only when it is in the other half day */
export function applyItem(timeStampValue: TimeStamp, type: ColumnType, itemValue: string, use12Hours: boolean, isAMValue: boolean) {
    const date = getDisplayDateFromTimeStamp(timeStampValue, use12Hours && !isAMValue);
    const hours = date.getHours();
    if (type === 'hour') {
        date.setHours(use12Hours ? (Number(itemValue) % 12) + (isAMValue ? 0 : 12) : Number(itemValue));
    } else if (type === 'minute') {
        date.setMinutes(Number(itemValue));
    } else if (type === 'second') {
        date.setSeconds(Number(itemValue));
    } else if (use12Hours) {
        const toPM = itemValue.toUpperCase() === 'PM';
        if (toPM && hours < 12) {
            date.setHours(hours + 12);
        } else if (!toPM && hours >= 12) {
            date.setHours(hours - 12);
        }
    }
    return date;
}
