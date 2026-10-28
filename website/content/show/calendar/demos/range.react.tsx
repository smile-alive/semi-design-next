import { Calendar } from '@fibrae/semi-ui-react';

export default function CalendarDemo() {
    return <Calendar mode="range" displayValue={new Date(2020, 8, 26)} range={[new Date(2020, 8, 26), new Date(2020, 8, 31)]} />;
}
