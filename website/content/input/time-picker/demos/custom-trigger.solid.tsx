import { createSignal, Show } from 'solid-js';
import * as dateFns from 'date-fns';
import { IconTimePicker } from '@fibrae/semi-icons-solid/lab';
import { Tag, TimePicker } from '@fibrae/semi-ui-solid';

const formatToken = 'HH:mm:ss';

export default function TimePickerDemo() {
    const [time, setTime] = createSignal<Date | undefined>(new Date(2024, 0, 1, 10, 30, 0));

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
