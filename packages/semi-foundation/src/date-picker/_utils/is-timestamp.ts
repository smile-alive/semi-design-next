import isValidDate from './is-valid-date';

export default function isTimestamp(ts: any) {
    return typeof ts === 'number' && isValidDate(new Date(ts));
}
