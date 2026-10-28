import { type Locale as dateFnsLocale, addMonths } from 'date-fns';
import isTimestamp from './is-timestamp';
import isValidDate from './is-valid-date';
import { compatibleParse } from './parser';
import toDateArg from './to-date-arg';

/**
 * get left panel picker date and right panel picker date
 */
export default function getDefaultPickerDate({ defaultPickerValue, format, dateFnsLocale }: GetDefaultPickerValueDateOptions) {
    let nowDate = Array.isArray(defaultPickerValue) ? defaultPickerValue[0] : defaultPickerValue;
    let nextDate = Array.isArray(defaultPickerValue) ? defaultPickerValue[1] : undefined;

    switch (true) {
        case isValidDate(nowDate):
            break;
        case isTimestamp(nowDate):
            nowDate = new Date(nowDate);
            break;
        case typeof nowDate === 'string':
            nowDate = compatibleParse(nowDate, format, undefined, dateFnsLocale);
            break;
        default:
            nowDate = new Date();
            break;
    }

    switch (true) {
        case isValidDate(nextDate):
            break;
        case isTimestamp(nextDate):
            nextDate = new Date(nextDate);
            break;
        case typeof nextDate === 'string':
            nextDate = compatibleParse(nextDate, format, undefined, dateFnsLocale);
            break;
        default:
            nextDate = addMonths(toDateArg(nowDate), 1);
            break;
    }

    return {
        nowDate: nowDate as Date,
        nextDate: nextDate as Date,
    };
}

type BaseValueType = string | number | Date;

interface GetDefaultPickerValueDateOptions {
    defaultPickerValue?: BaseValueType | BaseValueType[];
    format: string;
    dateFnsLocale: dateFnsLocale;
}
