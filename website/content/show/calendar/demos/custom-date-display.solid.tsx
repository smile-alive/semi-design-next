import { Avatar, Calendar } from '@fibrae/semi-ui-solid';

const displayValue = new Date(2023, 4, 14);
const colors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'lime'] as const;

const renderDateDisplay = (date: Date) => (
    <div style={{ 'padding-block': '6px' }}>
        <Avatar color={colors[date.getDay()]} size="small">
            {date.getDate()}
        </Avatar>
    </div>
);

export default function CalendarDemo() {
    return <Calendar height={400} mode="week" displayValue={displayValue} renderDateDisplay={renderDateDisplay} />;
}
