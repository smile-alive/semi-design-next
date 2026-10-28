import { useState } from 'react';
import { TimePicker } from '@fibrae/semi-ui-react';

export default function TimePickerDemo() {
    const [value, setValue] = useState<Date | Date[] | null>(null);

    const onChange = (time: Date | Date[]) => {
        console.log(time);
        setValue(time);
    };

    return <TimePicker value={value} onChange={onChange} />;
}
