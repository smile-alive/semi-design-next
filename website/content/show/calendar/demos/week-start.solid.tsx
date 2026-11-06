import { For, createSignal } from 'solid-js';
import { Calendar, type CalendarProps, Radio, RadioGroup } from '@fibrae/semi-ui-solid';

const displayValue = new Date(2019, 6, 23);
const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function CalendarDemo() {
    const [v, setV] = createSignal<CalendarProps['weekStartsOn']>(0);
    return (
        <div>
            <RadioGroup value={v()} aria-label="周起始日" type="button" name="demo-radio-group-vertical" onChange={(e) => setV(e.target.value)}>
                <For each={days}>{(day, index) => <Radio value={index()}>{day}</Radio>}</For>
            </RadioGroup>
            <Calendar style={{ 'margin-block-start': '20px' }} mode="month" displayValue={displayValue} weekStartsOn={v()} />
        </div>
    );
}
