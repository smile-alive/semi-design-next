import { useState, useCallback, type MouseEvent } from 'react';
import * as dateFns from 'date-fns';
import { IconClose, IconChevronDown } from '@fibrae/semi-icons-react';
import { DatePicker, Button, ButtonGroup } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    const [date, setDate] = useState<Date | null>(() => new Date(2024, 4, 6, 10, 30, 0));
    const formatToken = 'yyyy-MM-dd';
    const onChange = useCallback((date: Date | Date[]) => {
        setDate(date as Date);
    }, []);
    const onClear = useCallback((e?: MouseEvent) => {
        e?.stopPropagation();
        setDate(null);
    }, []);

    return (
        <DatePicker
            onChange={onChange}
            value={date}
            format={formatToken}
            triggerRender={(triggerProps) => (
                // The clear button is a sibling of the trigger button: buttons cannot nest
                <ButtonGroup theme="light">
                    <Button icon={<IconChevronDown />} iconPosition="right">
                        {Array.isArray(triggerProps.value) && triggerProps.value.length ? dateFns.format(triggerProps.value[0], formatToken) : triggerProps.placeholder}
                    </Button>
                    {date && <Button icon={<IconClose />} aria-label="清除" onClick={onClear} />}
                </ButtonGroup>
            )}
        />
    );
}
