import { isSameDay as dateFnsIsSameDay } from 'date-fns';
import { toDateOrParse } from './to-date-arg';

export default function isSameDay(date: string | Date, dateToCompare: string | Date) {
    return dateFnsIsSameDay(toDateOrParse(date), toDateOrParse(dateToCompare));
}
