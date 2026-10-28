import { createSignal } from 'solid-js';
import { TimePicker } from '@fibrae/semi-ui-solid';

export default function TimePickerDemo() {
    const [value, setValue] = createSignal<Date | Date[] | null>(null);

    const onChange = (time: Date | Date[]) => {
        console.log(time);
        setValue(time);
    };

    return <TimePicker value={value()} onChange={onChange} />;
}
