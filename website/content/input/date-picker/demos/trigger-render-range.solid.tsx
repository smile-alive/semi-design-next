import { createSignal, Show } from 'solid-js';
import * as dateFns from 'date-fns';
import { IconClose, IconChevronDown } from '@fibrae/semi-icons-solid';
import { DatePicker, Button, ButtonGroup } from '@fibrae/semi-ui-solid';

const formatToken = 'yyyy-MM-dd HH:mm:ss';

export default function DatePickerDemo() {
    const [date, setDate] = createSignal<Date | Date[]>();
    const onChange = (value: Date | Date[]) => {
        setDate(value);
        console.log(value);
    };
    const onClear = (e?: MouseEvent) => {
        e?.stopPropagation();
        setDate(undefined);
    };

    return (
        <DatePicker
            type="dateTimeRange"
            onChange={onChange}
            value={date()}
            triggerRender={(triggerProps) => (
                // The clear button is a sibling of the trigger button: buttons cannot nest
                <ButtonGroup theme="light">
                    <Button icon={<IconChevronDown />} iconPosition="right">
                        {triggerProps.value?.length ? `${dateFns.format(triggerProps.value[0], formatToken)} ~ ${dateFns.format(triggerProps.value[1], formatToken)}` : '请选择日期时间范围'}
                    </Button>
                    <Show when={triggerProps.value?.length}>
                        <Button icon={<IconClose />} aria-label="清除" onClick={onClear} />
                    </Show>
                </ButtonGroup>
            )}
        />
    );
}
