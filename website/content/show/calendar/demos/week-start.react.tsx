import { useState } from 'react';
import { RadioGroup, Calendar, Radio, type CalendarProps } from '@fibrae/semi-ui-react';

const displayValue = new Date(2019, 6, 23);

export default function CalendarDemo() {
    const [v, setV] = useState<CalendarProps['weekStartsOn']>(0);
    return (
        <div>
            <RadioGroup defaultValue={v} aria-label="周起始日" type="button" name="demo-radio-group-vertical" onChange={(e) => setV(e.target.value)}>
                <Radio value={0}>周日</Radio>
                <Radio value={1}>周一</Radio>
                <Radio value={2}>周二</Radio>
                <Radio value={3}>周三</Radio>
                <Radio value={4}>周四</Radio>
                <Radio value={5}>周五</Radio>
                <Radio value={6}>周六</Radio>
            </RadioGroup>
            <Calendar style={{ marginTop: 20 }} mode="month" displayValue={displayValue} weekStartsOn={v} />
        </div>
    );
}
