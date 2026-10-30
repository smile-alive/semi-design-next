import type { JSX } from 'solid-js';
import { Calendar } from '@fibrae/semi-ui-solid';

const importantDate: JSX.CSSProperties = {
    position: 'absolute',
    left: '0',
    right: '0',
    top: '0',
    bottom: '0',
    'background-color': 'var(--semi-color-danger-light-default)',
};
const displayValue = new Date(2019, 6, 23, 8, 32, 0);
const importDates = [new Date(2019, 6, 2), new Date(2019, 6, 8), new Date(2019, 6, 19), new Date(2019, 6, 23)];

function dateRender(dateString?: string) {
    if (importDates.some((date) => date.toString() === dateString)) {
        return <div style={importantDate} />;
    }
    return null;
}

export default function CalendarDemo() {
    return <Calendar height={700} mode="month" displayValue={displayValue} dateGridRender={dateRender} />;
}
