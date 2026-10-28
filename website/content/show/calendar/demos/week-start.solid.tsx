import { createSignal } from 'solid-js';
import { Calendar, type CalendarProps, Radio, RadioGroup } from '@fibrae/semi-ui-solid';

export default function CalendarDemo() {
    const [v, setV] = createSignal<CalendarProps['weekStartsOn']>(0);
    return (
        <div>
            <RadioGroup value={v()} aria-label="周起始日" type="button" name="demo-radio-group-vertical" onChange={(e) => setV(e.target.value)}>
                <Radio value={0}>周日</Radio>
                <Radio value={1}>周一</Radio>
                <Radio value={2}>周二</Radio>
                <Radio value={3}>周三</Radio>
                <Radio value={4}>周四</Radio>
                <Radio value={5}>周五</Radio>
                <Radio value={6}>周六</Radio>
            </RadioGroup>
            <Calendar style={{ 'margin-top': '20px' }} mode="month" displayValue={new Date(2019, 6, 23)} weekStartsOn={v()} />
        </div>
    );
}
