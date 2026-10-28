import { Calendar } from '@fibrae/semi-ui-solid';

export default function CalendarDemo() {
    return <Calendar mode="month" displayValue={new Date(2019, 6, 23)} />;
}
