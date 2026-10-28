import { createSignal, Show } from 'solid-js';
import * as dateFns from 'date-fns';
import { IconTimePicker } from '@fibrae/semi-icons-solid/lab';
import { Tag, TimePicker } from '@fibrae/semi-ui-solid';

export default function TimePickerDemo() {
    const formatToken = 'HH:mm:ss';
    const [time, setTime] = createSignal<Date | undefined>(new Date(2024, 4, 6, 12));

    return (
        <TimePicker
            value={time()}
            format={formatToken}
            onChange={(value: Date) => setTime(value)}
            triggerRender={(props) => (
                <Tag color="cyan" size="large" shape="circle" style={{ padding: '12px', 'padding-right': '16px', 'font-size': '14px' }} type="light" prefixIcon={<IconTimePicker />}>
                    <Show when={time()} fallback={props.placeholder}>
                        {(date) => dateFns.format(date(), formatToken)}
                    </Show>
                </Tag>
            )}
        />
    );
}
