import { DatePicker, Tooltip } from '@fibrae/semi-ui-solid';

const dateStyle = {
    width: '100%',
    height: '100%',
    border: '1px solid var(--semi-color-primary)',
    display: 'flex',
    'justify-content': 'center',
    'align-items': 'center',
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

export default function DatePickerDemo() {
    return <DatePicker renderDate={renderDate} />;
}
