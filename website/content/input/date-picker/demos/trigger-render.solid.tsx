import { createSignal, Show } from 'solid-js';
import * as dateFns from 'date-fns';
import { IconClose, IconChevronDown } from '@fibrae/semi-icons-solid';
import { DatePicker, Button, ButtonGroup } from '@fibrae/semi-ui-solid';

const formatToken = 'yyyy-MM-dd';

export default function DatePickerDemo() {
    const [date, setDate] = createSignal<Date | undefined>(new Date(2024, 4, 6, 12));
    const dateText = () => {
        const value = date();
        return value ? dateFns.format(value, formatToken) : undefined;
    };
    const onChange = (value: Date | Date[]) => {
        setDate(value as Date);
    };
    const onClear = (e?: MouseEvent) => {
        e?.stopPropagation();
        setDate(undefined);
    };

    return (
        <DatePicker
            onChange={onChange}
            value={date()}
            format={formatToken}
            triggerRender={(triggerProps) => (
                // The clear button is a sibling of the trigger button: buttons cannot nest
                <ButtonGroup theme="light">
                    <Button icon={<IconChevronDown />} iconPosition="right">
                        {dateText() ?? triggerProps.placeholder}
                    </Button>
                    <Show when={date()}>
                        <Button icon={<IconClose />} aria-label="清除" onClick={onClear} />
                    </Show>
                </ButtonGroup>
            )}
        />
    );
}
