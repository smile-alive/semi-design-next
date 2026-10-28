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

    const triggerContent = () => {
        const value = date();
        if (Array.isArray(value) && value.length) {
            return `${dateFns.format(value[0], formatToken)} ~ ${dateFns.format(value[1], formatToken)}`;
        }
        return '请选择日期时间范围';
    };

    return (
        <DatePicker
            type="dateTimeRange"
            onChange={onChange}
            value={date()}
            triggerRender={() => (
                // The clear button is a sibling of the trigger button: buttons cannot nest
                <ButtonGroup theme="light">
                    <Button icon={<IconChevronDown />} iconPosition="right">
                        {triggerContent()}
                    </Button>
                    <Show when={date()}>
                        <Button icon={<IconClose />} aria-label="清除" onClick={onClear} />
                    </Show>
                </ButtonGroup>
            )}
        />
    );
}
