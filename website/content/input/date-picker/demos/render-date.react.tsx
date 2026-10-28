import { DatePicker, Tooltip } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    const dateStyle = {
        width: '100%',
        height: '100%',
        border: '1px solid var(--semi-color-primary)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };
    const renderDate = (dayNumber?: number) => {
        if (dayNumber === 1) {
            return (
                <Tooltip content="Always Day 1">
                    <div style={dateStyle}>{dayNumber}</div>
                </Tooltip>
            );
        }
        return dayNumber;
    };
    return <DatePicker renderDate={renderDate} />;
}
