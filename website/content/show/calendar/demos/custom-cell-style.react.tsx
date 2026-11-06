import type { CSSProperties } from 'react';
import { Calendar } from '@fibrae/semi-ui-react';

const importantDate: CSSProperties = {
    position: 'absolute',
    insetInline: '0',
    top: '0',
    bottom: '0',
    backgroundColor: 'var(--semi-color-danger-light-default)',
};
const displayValue = new Date(2019, 6, 23, 8, 32, 0);
const importDates = [new Date(2019, 6, 2), new Date(2019, 6, 8), new Date(2019, 6, 19), new Date(2019, 6, 23)];

export default function CalendarDemo() {
    const dateRender = (dateString?: string) => {
        if (importDates.some((date) => date.toString() === dateString)) {
            return <div style={importantDate} />;
        }
        return null;
    };
    return <Calendar height={700} mode="month" displayValue={displayValue} dateGridRender={dateRender} />;
}
