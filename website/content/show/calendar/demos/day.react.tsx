import { Calendar } from '@fibrae/semi-ui-react';

const displayValue = new Date(2026, 9, 25);

export default function CalendarDemo() {
    return <Calendar mode="day" displayValue={displayValue} />;
}
