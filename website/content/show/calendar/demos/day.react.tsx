import { useSyncExternalStore } from 'react';
import { Calendar } from '@fibrae/semi-ui-react';

const fixedDay = new Date(2019, 6, 23, 12);
const today = new Date();
const subscribe = () => () => {};

export default function CalendarDemo() {
    // The server and the browser may disagree on today, so the first frame shows a fixed day and moves to today
    // after hydration, where the current time line can show
    const displayValue = useSyncExternalStore(
        subscribe,
        () => today,
        () => fixedDay
    );
    return <Calendar mode="day" displayValue={displayValue} />;
}
