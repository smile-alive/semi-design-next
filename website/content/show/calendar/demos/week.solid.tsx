import { Calendar } from '@fibrae/semi-ui-solid';

// A fixed date keeps the server render and the browser on the same first frame
const displayValue = new Date(2026, 9, 25);

export default function CalendarDemo() {
    return <Calendar mode="week" displayValue={displayValue} />;
}
