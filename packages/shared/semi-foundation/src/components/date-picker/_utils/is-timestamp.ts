import { isValidDate } from '../../../utils/date-fns-extra';

export default function isTimestamp(ts: any) {
    return typeof ts === 'number' && isValidDate(new Date(ts));
}
