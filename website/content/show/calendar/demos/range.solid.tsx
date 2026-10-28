import { Calendar } from '@fibrae/semi-ui-solid';

const displayValue = new Date(2020, 8, 26);
const range = [new Date(2020, 8, 26), new Date(2020, 8, 31)];

export default function CalendarDemo() {
    return <Calendar mode="range" displayValue={displayValue} range={range} />;
}
