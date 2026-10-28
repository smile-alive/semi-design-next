import { Avatar, Calendar } from '@fibrae/semi-ui-react';

export default function CalendarDemo() {
    const displayValue = new Date(2023, 4, 14);

    const renderDateDisplay = (date: Date) => {
        const colors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'lime'] as const;
        return (
            <div style={{ paddingBlock: 6 }}>
                <Avatar color={colors[date.getDay()]} size="small">
                    {date.getDate()}
                </Avatar>
            </div>
        );
    };

    return <Calendar height={400} mode="week" displayValue={displayValue} renderDateDisplay={renderDateDisplay} />;
}
