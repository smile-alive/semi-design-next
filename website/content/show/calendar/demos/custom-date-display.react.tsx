import { Avatar, Calendar } from '@fibrae/semi-ui-react';

const displayValue = new Date(2023, 4, 14);
const colors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'lime'] as const;

export default function CalendarDemo() {
    const renderDateDisplay = (date: Date) => (
        <div style={{ paddingBlock: 6 }}>
            <Avatar color={colors[date.getDay()]} size="small">
                {date.getDate()}
            </Avatar>
        </div>
    );

    return <Calendar height={400} mode="week" displayValue={displayValue} renderDateDisplay={renderDateDisplay} />;
}
