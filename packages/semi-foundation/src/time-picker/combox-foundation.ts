import { isValidDate } from '../date-picker/_utils/index';
import { strings } from './constants';

export type TimeStamp = Date | string | number;
export type ColumnType = 'ampm' | 'hour' | 'minute' | 'second';

/** The props one time panel is computed from */
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

/** Pure calculations for one time panel: which columns show, what each lists, and the time a picked item makes */
export default class ComboboxFoundation {
    /** The columns `format` asks for */
    static getColumns(format: string) {
        return {
            showHour: /HH|hh|H|h/.test(format),
            showMinute: format.includes('mm'),
            showSecond: format.includes('ss'),
        };
    }

    /**
     * The items and the selected index of each column. Every column reads the shown time (midnight, or noon in a PM
     * panel, while there is no value), the time a picked item is applied to.
     */
    static getOptions(props: ComboboxBaseProps) {
        const { timeStampValue, use12Hours, hourStep, disabledMinutes, disabledSeconds, hideDisabledOptions, minuteStep, secondStep } = props;

        const format = typeof props.format === 'string' ? props.format : strings.DEFAULT_FORMAT;
        const isAM = ComboboxFoundation.isAM(timeStampValue, props.defaultIsAM);
        const dateTime = ComboboxFoundation.getDisplayDateFromTimeStamp(timeStampValue, use12Hours && !isAM);
        const hours = dateTime.getHours();
        const minutes = dateTime.getMinutes();

        const disabledHourOptions = ComboboxFoundation.getDisabledHours({ ...props, isAM });
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
            ...ComboboxFoundation.getColumns(format),
            isAM,
            hour: toColumn(hourOptions, disabledHourOptions, use12Hours ? hours % 12 || 12 : hours),
            minute: toColumn(minuteOptions, disabledMinuteOptions, minutes),
            second: toColumn(secondOptions, disabledSecondOptions, dateTime.getSeconds()),
        };
    }

    /**
     * The time after picking `itemValue` in column `type`. A 12-hour hour keeps the half day `isAM` names; AM/PM moves
     * the time by 12 hours only when it is in the other half day.
     */
    static applyItem(timeStampValue: TimeStamp, type: ColumnType, itemValue: string, use12Hours: boolean, isAM: boolean) {
        const date = ComboboxFoundation.getDisplayDateFromTimeStamp(timeStampValue, use12Hours && !isAM);
        const hours = date.getHours();
        if (type === 'hour') {
            date.setHours(use12Hours ? (Number(itemValue) % 12) + (isAM ? 0 : 12) : Number(itemValue));
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

    /**
     * `disabledHours()`, mapped onto the 12-hour column of the half day `isAM` names when `use12Hours`; the hours of
     * the other half day drop out
     */
    static getDisabledHours({ use12Hours, disabledHours, isAM }: Pick<ComboboxBaseProps, 'use12Hours' | 'disabledHours'> & { isAM?: boolean }) {
        const disabledOptions = disabledHours && disabledHours();

        if (use12Hours && Array.isArray(disabledOptions)) {
            return disabledOptions.filter((h) => h < 12 === Boolean(isAM)).map((h) => h % 12 || 12);
        }
        return disabledOptions;
    }

    /** The half day of the value; `defaultIsAM` applies while there is no value */
    static isAM(timeStamp: TimeStamp, defaultIsAM = true) {
        return ComboboxFoundation.hasValue(timeStamp) ? ComboboxFoundation.getDisplayDateFromTimeStamp(timeStamp).getHours() < 12 : defaultIsAM;
    }

    /** A timestamp of 0 is a value; only nothing and '' are not */
    static hasValue(timeStamp: unknown) {
        return timeStamp != null && timeStamp !== '' && isValidDate(new Date(timeStamp as Date));
    }

    /** The time a panel shows; without a value, today's midnight, or noon when the panel shows PM */
    static getDisplayDateFromTimeStamp(timeStamp: TimeStamp, defaultIsPM = false) {
        if (!ComboboxFoundation.hasValue(timeStamp)) {
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), defaultIsPM ? 12 : 0);
        }
        return new Date(timeStamp);
    }
}
