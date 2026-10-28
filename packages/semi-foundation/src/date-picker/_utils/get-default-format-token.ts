import { strings } from '../constants';

const defaultFormatTokens = {
    date: strings.FORMAT_FULL_DATE,
    dateTime: strings.FORMAT_DATE_TIME,
    dateRange: strings.FORMAT_FULL_DATE,
    dateTimeRange: strings.FORMAT_DATE_TIME,
    month: strings.FORMAT_YEAR_MONTH,
    monthRange: strings.FORMAT_YEAR_MONTH,
    year: strings.FORMAT_YEAR,
} as const;

export default function getDefaultFormatToken(_type: string) {
    return defaultFormatTokens;
}

export function getDefaultFormatTokenByType(type: string) {
    return type && defaultFormatTokens[type];
}
