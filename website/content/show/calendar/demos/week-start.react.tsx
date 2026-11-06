import { useState } from 'react';
import { RadioGroup, Calendar, Radio, type CalendarProps } from '@fibrae/semi-ui-react';

const displayValue = new Date(2019, 6, 23);
const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function CalendarDemo() {
    const [v, setV] = useState<CalendarProps['weekStartsOn']>(0);
    return (
        <div>
            <RadioGroup value={v} aria-label="周起始日" type="button" name="demo-radio-group-vertical" onChange={(e) => setV(e.target.value)}>
                {days.map((day, index) => (
                    <Radio key={day} value={index}>
                        {day}
                    </Radio>
                ))}
            </RadioGroup>
            <Calendar style={{ marginBlockStart: 20 }} mode="month" displayValue={displayValue} weekStartsOn={v} />
        </div>
    );
}
