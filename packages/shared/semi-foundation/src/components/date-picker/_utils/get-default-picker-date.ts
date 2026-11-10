import { type Locale as dateFnsLocale, addMonths } from 'date-fns';
import { toWallTime } from '../../../utils/zoned-time';
import parseValue, { isPickerValue } from './parse-value';
import toDateArg from './to-date-arg';

type BaseValueType = string | number | Date;

interface GetDefaultPickerValueDateOptions {
    defaultPickerValue?: BaseValueType | BaseValueType[];
    format: string;
    dateFnsLocale: dateFnsLocale;
    timeZone?: string | number;
}

/** Read like `value`; without one the left panel shows the current month of `timeZone` */
export default function getDefaultPickerDate({ defaultPickerValue, format, dateFnsLocale, timeZone }: GetDefaultPickerValueDateOptions) {
    const [now, next] = Array.isArray(defaultPickerValue) ? defaultPickerValue : [defaultPickerValue];
    const options = { format, dateFnsLocale, timeZone };
    // an unparseable string counts as absent
    const nowDate = (isPickerValue(now) && parseValue(now, options)) || toWallTime(new Date(), timeZone);
    const nextDate = (isPickerValue(next) && parseValue(next, options)) || addMonths(toDateArg(nowDate), 1);

    return { nowDate, nextDate };
}
