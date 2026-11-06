import { useState } from 'react';
import * as dateFns from 'date-fns';
import { IconTimePicker } from '@fibrae/semi-icons-react/lab';
import { TimePicker, Tag } from '@fibrae/semi-ui-react';

const formatToken = 'HH:mm:ss';

export default function TimePickerDemo() {
    const [time, setTime] = useState(() => new Date(2024, 0, 1, 10, 30, 0));

    return (
        <TimePicker
            value={time}
            format={formatToken}
            onChange={(time: Date | Date[]) => setTime(time as Date)}
            triggerRender={({ placeholder }) => (
                <Tag color="cyan" size="large" shape="circle" style={{ padding: 12, paddingRight: 16, fontSize: 14 }} type="light" prefixIcon={<IconTimePicker />}>
                    {time ? dateFns.format(time, formatToken) : placeholder}
                </Tag>
            )}
        />
    );
}
