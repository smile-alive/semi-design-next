import { isBefore as dateFnsIsBefore } from 'date-fns';
import { toDateOrParse } from './to-date-arg';

export default function isBefore(date: Date | string, dateToCompare: Date | string) {
    return dateFnsIsBefore(toDateOrParse(date), toDateOrParse(dateToCompare));
}
