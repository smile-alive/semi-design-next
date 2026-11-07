import { isAfter as dateFnsIsAfter } from 'date-fns';
import { toDateOrParse } from './to-date-arg';

export default function isAfter(date: string | Date, dateToCompare: string | Date) {
    return dateFnsIsAfter(toDateOrParse(date), toDateOrParse(dateToCompare));
}
