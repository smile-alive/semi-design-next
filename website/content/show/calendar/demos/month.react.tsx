import { Calendar } from '@fibrae/semi-ui-react';

const displayValue = new Date(2019, 6, 23);

export default function CalendarDemo() {
    return <Calendar mode="month" displayValue={displayValue} />;
}
